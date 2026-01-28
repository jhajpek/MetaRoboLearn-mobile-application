import {
    View, Text,
    StyleSheet,
    Dimensions,
    Switch, Animated,
    TouchableOpacity,
    PanResponder,
    Alert, Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect, useRef } from "react";
import { DeviceMotion, Accelerometer } from "expo-sensors";
import { io } from "socket.io-client";
import Constants from "expo-constants";
import axios from "axios";


const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");
const CAMERA_WIDTH = 320;
const CAMERA_HEIGHT = 240;
const TURN_THRESHOLD = 0.2;
const COMMAND_DURATION = 0.2;
const JOYSTICK_SIZE = HEIGHT * 0.5;
const JOYSTICK_RADIUS = JOYSTICK_SIZE * 0.5


const Controller = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [accelerometerOutput, setAccelerometerOutput] = useState({ x: 0, y: 0, z: 0 });
    const [isGyroscopeOn, setIsGyroscopeOn] = useState(false);
    const [angle, setAngle] = useState(0);
    const [lastCommand, setLastCommand] = useState("");
    const [speed, setSpeed] = useState(55);
    const [cameraOn, setCameraOn] = useState(false);
    const [handSide, setHandSide] = useState(true);
    const [image, setImage] = useState("");
    const [url] = useState(Constants.expoConfig.extra.BACKEND_URL);
    const [port] = useState(Constants.expoConfig.extra.BACKEND_PORT);
    const [isFromController, setIsFromController] = useState(false);
    const timeoutRef = useRef(null);

    const cameraResponderRef = useRef(new Animated.ValueXY({ x: 0, y: HEIGHT - CAMERA_HEIGHT})).current;
    const cameraResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                cameraResponderRef.setOffset({
                    x: cameraResponderRef.x._value,
                    y: cameraResponderRef.y._value,
                });
                cameraResponderRef.setValue({ x: 0, y: 0 });
            },

            onPanResponderMove: (gestureEvent, gestureState) => {
                const newX = cameraResponderRef.x._offset + gestureState.dx;
                const newY = cameraResponderRef.y._offset + gestureState.dy;

                const clampedX = Math.max(0, Math.min(newX, WIDTH - CAMERA_WIDTH - 2 * insets.left));
                const clampedY = Math.max(0, Math.min(newY, HEIGHT - CAMERA_HEIGHT));

                cameraResponderRef.x.setValue(clampedX - cameraResponderRef.x._offset);
                cameraResponderRef.y.setValue(clampedY - cameraResponderRef.y._offset);
            },

            onPanResponderRelease: () => {
                cameraResponderRef.flattenOffset();
            }
        })
    ).current;

    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const joystickResponderRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const joystickResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderMove: (_, gesture) => {
                const distance = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);

                let x = gesture.dx;
                let y = gesture.dy;

                if (distance > JOYSTICK_RADIUS) {
                    const angle = Math.atan2(gesture.dy, gesture.dx);
                    x = Math.cos(angle) * JOYSTICK_RADIUS;
                    y = Math.sin(angle) * JOYSTICK_RADIUS;
                }

                joystickResponderRef.setValue({ x, y });
                handleJoystickMove(x, y);
            },

            onPanResponderRelease: () => {
                Animated.spring(joystickResponderRef, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();

                setJoystickPosition({ x: 0, y: 0 });
            }
        })
    ).current;

    const handleJoystickMove = (dx, dy) => {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= JOYSTICK_RADIUS * 0.5) {
            setJoystickPosition({ x: 0, y: 0 });
            return;
        }

        setJoystickPosition({
            x: dx / JOYSTICK_RADIUS,
            y: -dy / JOYSTICK_RADIUS,
        });
    };

    const commandIntervalRef = useRef(null);
    useEffect(() => {
        const { x, y } = joystickPosition;
        const distance = Math.sqrt(x * x + y * y);
        setSpeed(distance === 0 ? 0 : 40 + Math.min(distance, 1)  * 30);

        if (distance <= 0.05) {
            if (commandIntervalRef.current) {
                clearInterval(commandIntervalRef.current);
                commandIntervalRef.current = null;
            }

            abort().then()
            return;
        }

        let newCommand = "";
        if (Math.abs(y) > Math.abs(x)) {
            newCommand = y > 0 ? "forward" : "back";
        } else {
            newCommand = x > 0 ? "turn_right" : "turn_left";
        }

        if (newCommand === lastCommand) {
            console.log("BUG" + newCommand);
            return;
        }

        if (commandIntervalRef.current) {
            clearInterval(commandIntervalRef.current);
        }

        abort().then();

        execute(newCommand, COMMAND_DURATION, false).then();
        commandIntervalRef.current = setInterval(() => {
            execute(newCommand, COMMAND_DURATION, false).then();
        }, COMMAND_DURATION * 1000);

    }, [joystickPosition]);


    useEffect(() => {
        if (!cameraOn) {
            return;
        }

        const socket = io(`${ url }:${ port }`);

        socket.on("camera_frame", (data) => {
            if (data.image) {
                setImage(`data:image/jpeg;base64,${data.image}`);
            }
        });

        return () => {
            socket.disconnect();
        }
    }, [cameraOn, image]);

    const execute = async (command, duration, isGyroOn) => {
        await axios.post(`${ url }:${ port }/execute`, {
            "code": `${ command }(${ duration }, ${ speed })`
        }).then(() => {
            if (!isGyroOn) {
                setIsFromController(true);
            }
            setLastCommand(command);
            timeoutRef.current = setTimeout(() => {
                if (!isGyroOn) {
                    setLastCommand("");
                    setIsFromController(false);
                }
            }, duration * 1000);
        }).catch((reason) => {
            console.log(reason);
        });
    };

    const abort = async () => {
        await axios.post(`${ url }:${ port }/abort`)
            .then(() => {
                setLastCommand("");
                setIsFromController(false);
                clearTimeout(timeoutRef.current);
            }).catch((reason) => {
                console.log(reason);
            });
    };

    const cameraClick = () => {
        if (!cameraOn) {
            Alert.alert("UPALJENA KAMERA", "Prozor u kojem se prikazuje prijenos s kamere možete podesiti njegovim povlačenjem na drugi kraj ekrana.", [ { text: "Zatvori" } ])
        }
        setCameraOn(prev => !prev);
    };

    const fetchFail = () => {
        Alert.alert("UPOZORENJE", "Niste spojeni na istu mrežu kao i robot ili robot nije upaljen.", [ { text: "Zatvori" } ]);
    };

    useEffect(() => {
        Accelerometer.setUpdateInterval(COMMAND_DURATION * 1000);
        let accelerometerIncome;
        if (isGyroscopeOn) {
            accelerometerIncome = Accelerometer.addListener(
                ({ x, y, z }) => setAccelerometerOutput({ x: x, y: y, z: z }));
        } else {
            accelerometerIncome?.remove();
        }

        return () => accelerometerIncome?.remove();
    }, [isGyroscopeOn, lastCommand]);

    useEffect(() => {
        DeviceMotion.setUpdateInterval(COMMAND_DURATION * 1000);
        let motionIncome;
        if (isGyroscopeOn) {
            motionIncome = DeviceMotion.addListener(async ({ rotation }) => {
                if (Math.abs(accelerometerOutput.x) >= 2 ||
                    Math.abs(accelerometerOutput.y) >= 2 ||
                    Math.abs(accelerometerOutput.z) >= 2) {
                    setAccelerometerOutput({ x: 0, y: 0, z: 0 });
                    setIsGyroscopeOn(false);
                    setLastCommand("");
                    return;
                }

                if (!rotation) {
                    return;
                }

                setAngle(rotation.beta ?? 0);

                if (angle > TURN_THRESHOLD && lastCommand === "") {
                    await execute("turn_right", COMMAND_DURATION, true);
                } else if (angle < -TURN_THRESHOLD && lastCommand === "") {
                    await execute("turn_left", COMMAND_DURATION, true);
                } else if (angle >= -TURN_THRESHOLD && angle <= TURN_THRESHOLD && lastCommand !== "" && !isFromController) {
                    await abort();
                } else if (lastCommand.startsWith("turn") && !isFromController) {
                    await execute(lastCommand, COMMAND_DURATION, true);
                }
            });
        } else motionIncome?.remove();

        return () => motionIncome?.remove();
    }, [accelerometerOutput]);

    const styles = StyleSheet.create({
        container: {
            flexDirection: "row",
            width: WIDTH,
            backgroundColor: "#8AE6E8",
            alignItems: "center",
            justifyContent: "space-between",
        },
        blackView: {
            height: HEIGHT,
            width: insets.left,
            backgroundColor: "black",
        },
        settings: {
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
            gap: 20,
            width: WIDTH / 2 - insets.left,
        },
        controller: {
            justifyContent: "center",
            alignItems: "center",
        },
        joystickBase: {
            width: JOYSTICK_SIZE,
            height: JOYSTICK_SIZE,
            borderRadius: JOYSTICK_RADIUS,
            backgroundColor: "#33D3D6",
            justifyContent: "center",
            alignItems: "center",
        },
        joystickKnob: {
            width: JOYSTICK_RADIUS,
            height: JOYSTICK_RADIUS,
            borderRadius: JOYSTICK_RADIUS / 2,
            backgroundColor: "#FED857",
        },
        row: {
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
        },
        backButton: {
            justifyContent: "center",
            height: 50,
            backgroundColor: "#FE7569",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 10,
        },
        cameraButton: {
            justifyContent: "center",
            height: 50,
            backgroundColor: "#FED857",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 10,
        },
        toggleButton: {
            justifyContent: "center",
            height: 50,
            backgroundColor: "#33D3D6",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 10,
        },
        backButtonText: {
            color: "#FFF",
            fontWeight: "bold",
            fontSize: 15,
        },
        cameraContainer: {
            position: "absolute",
            left: insets.left,
            top: insets.top,
            width: CAMERA_WIDTH,
            height: CAMERA_HEIGHT,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#FFF",
            transform: cameraResponderRef.getTranslateTransform(),
        },
        camera: {
            width: CAMERA_WIDTH,
            height: CAMERA_HEIGHT,
            borderRadius: 10,
        },
        image: {
            width: 45,
            height: 35,
        },
    });

    const renderSettings = () => (
        <View style={ styles.settings }>
            <View style={ styles.row }>
                <TouchableOpacity style={ styles.backButton } onPress={ () => navigation.navigate("Games") }>
                    <Image source={ require("../assets/exit.png") } style={ styles.image } />
                </TouchableOpacity>
                <TouchableOpacity style={ styles.cameraButton } onPress={ () => cameraClick() }>
                    <Image source={ require("../assets/camera.png") } style={ styles.image } />
                </TouchableOpacity>
                <TouchableOpacity style={ styles.toggleButton } onPress={ () => setHandSide(prev => !prev) }>
                    <Text style={ styles.backButtonText }>{ handSide ? "Dešnjak" : "Ljevak" }</Text>
                </TouchableOpacity>
            </View>
            <View style={ styles.row }>
                <Text style={ styles.label }>Žiroskop:</Text>
                <Switch
                    trackColor={{ false: "#D7D7D7", true: "#33D3D6" }}
                    thumbColor={ isGyroscopeOn ? "#00B6BA" : "#FFF" }
                    onValueChange={ () => {
                        setIsGyroscopeOn(prev => !prev);
                        if(lastCommand !== "") {
                            abort().then(() => {});
                        }
                    }}
                    value={ isGyroscopeOn }
                    style={{ alignSelf: "center" }}
                />
            </View>
            <Text>{ lastCommand }</Text>
            <Text>
                x: {joystickPosition.x.toFixed(2)} | y: {joystickPosition.y.toFixed(2)}
            </Text>

        </View>
    );

    const renderController = () => (
        <View style={ styles.controller }>
            <View style={ styles.joystickBase }>
                <Animated.View
                    style={[
                        styles.joystickKnob,
                        { transform: joystickResponderRef.getTranslateTransform() }
                    ]}
                    { ...joystickResponder.panHandlers }
                />
            </View>
        </View>
    );

    return (
        <View style={ styles.container }>
            <View style={ styles.blackView }></View>

            { cameraOn && <Animated.View style={ styles.cameraContainer } { ...cameraResponder.panHandlers }>
                { image !== "" ?
                    <Image
                        key="camera"
                        source={{ uri: image }}
                        style={ styles.camera }
                        resizeMode="cover"
                    /> :
                    <Text>Učitavanje kamere...</Text>
                }
            </Animated.View>
            }

            { handSide ?
                <>
                    { renderSettings() }
                    { renderController() }
                </> :
                <>
                    { renderController() }
                    { renderSettings() }
                </>
            }

            <View style={ styles.blackView }></View>
        </View>
    );
};

export default Controller;
