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
import { useState, useRef, useMemo, useEffect } from "react";
import { DeviceMotion, Accelerometer } from "expo-sensors";
import Constants from "expo-constants";
import BrokerClient from "../broker/BrokerClient"
import RobotList from "../components/RobotList";
import GAMES_DATA from "../resources/GamesData";

const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");
const CAMERA_WIDTH = 320;
const CAMERA_HEIGHT = 240;
const TURN_THRESHOLD = 0.2;
const DRIVE_THRESHOLD = 0.5;
const COMMAND_DURATION = 0;
const JOYSTICK_SIZE = HEIGHT * 0.5;
const JOYSTICK_RADIUS = JOYSTICK_SIZE * 0.5
const CAMERA_FEED_WEBSOCKET_BASE_URL = Constants.expoConfig.extra.CAMERA_FEED_WEBSOCKET_BASE_URL;

const Controller = ({ route }) => {
    const { gameId } = route.params;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [accelerometerOutput, setAccelerometerOutput] = useState({ x: 0, y: 0, z: 0 });
    const [isDeviceMotionOn, setIsDeviceMotionOn] = useState(false);
    const [lastCommand, setLastCommand] = useState("");
    const [speed, setSpeed] = useState(30);
    const [cameraOn, setCameraOn] = useState(false);
    const [handSide, setHandSide] = useState(true);
    const [image, setImage] = useState("");
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const [robotId, setRobotId] = useState(null);

    const brokerClient = useMemo(() => new BrokerClient(
        Constants.expoConfig.extra.BROKER_HTTP_API_BASE_URL,
        Constants.expoConfig.extra.CLIENT_NAME,
        Constants.expoConfig.extra.API_KEY
    ), []);
    const gamePlugin = useMemo(() => {
        const currentGame = GAMES_DATA.find(g => g.id === gameId);
        return currentGame?.plugin ? new currentGame.plugin() : null;
    }, [gameId]);

    const renderedGamePlugin = useMemo(() => {
        if (!gamePlugin) {
            return null;
        }
        return gamePlugin.render(brokerClient, robotId);
    }, [robotId, gamePlugin]);

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

            onPanResponderMove: (_, gestureState) => {
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
    const joystickResponderRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const joystickResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderMove: (_, gestureState) => {
                const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);

                let x = gestureState.dx;
                let y = gestureState.dy;

                if (distance > JOYSTICK_RADIUS) {
                    const angle = Math.atan2(y, x);
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
    const ws = useRef(null);

    const handleJoystickMove = (dx, dy) => {
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= JOYSTICK_RADIUS * 0.1) {
            setJoystickPosition({ x: 0, y: 0 });
            return;
        }

        setJoystickPosition({
            x: dx / JOYSTICK_RADIUS,
            y: -dy / JOYSTICK_RADIUS,
        });
    };

    useEffect(() => {
        if (isDeviceMotionOn) {
            return;
        }

        const { x, y } = joystickPosition;
        const distance = Math.sqrt(x * x + y * y);

        if (distance === 0) {
            if (lastCommand !== "") {
                abort();
            }
            return;
        }

        const newSpeed = 30 + Math.min(distance, 1)  * 50
        const speedDelta = Math.abs(newSpeed - speed);

        let newCommand;
        if (Math.abs(y) > Math.abs(x)) {
            newCommand = y > 0 ? "raw_forward" : "raw_back";
        } else {
            newCommand = x > 0 ? "raw_turn_right" : "raw_turn_left";
        }

        if (newCommand === lastCommand && speedDelta < 1)  {
            return;
        }

        setSpeed(newSpeed);

        execute(newCommand, COMMAND_DURATION).then();
    }, [joystickPosition]);

    useEffect(() => {
        if (!robotId) {
            return;
        }

        if (!cameraOn) {
            if (ws.current) {
                ws.current.close();
            }
            return;
        }

        const socketUrl = `${CAMERA_FEED_WEBSOCKET_BASE_URL}/robot/${robotId}/get-video-stream`;

        ws.current = new WebSocket(
            socketUrl,
            null,
            {
                headers: {
                    "client-id": brokerClient.clientId,
                    "token": brokerClient.token,
                }
            }
        );

        ws.current.onopen = () => {
            console.log("Camera Feed WS opened.");
        };

        ws.current.binaryType = "blob";

        ws.current.onmessage = (event) => {
            if (event.data instanceof Blob) {
                const reader = new FileReader();

                reader.onload = () => {
                    setImage(reader.result);
                };

                reader.onerror = (e) => {
                    console.error("Camera Feed WS --> FileReader error:", e);
                };

                reader.readAsDataURL(event.data);
            } else {
                try {
                    const parsed = JSON.parse(event.data);
                    setImage(`data:image/jpeg;base64,${parsed.data}`);
                } catch (e) {
                    setImage(`data:image/jpeg;base64,${event.data}`);
                }
            }
        };

        ws.current.onclose = () => {
            console.log("Camera Feed WS closed.");
        };

        ws.current.onerror = (e) => {
            console.log("Camera Feed WS Error:", e.message);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [cameraOn]);

    useEffect(() => {
        let accelerometerIncome;
        if (isDeviceMotionOn) {
            Accelerometer.setUpdateInterval(200);
            accelerometerIncome = Accelerometer.addListener(
                ({ x, y, z}) => setAccelerometerOutput({x, y, z})
            );
            return;
        }

        return () => accelerometerIncome?.remove();
    }, [isDeviceMotionOn]);

    useEffect(() => {
        DeviceMotion.setUpdateInterval(200);
        let motionIncome;
        if (isDeviceMotionOn) {
            motionIncome = DeviceMotion.addListener(async ({ rotation }) => {
                if (Math.abs(accelerometerOutput.x) >= 2 ||
                    Math.abs(accelerometerOutput.y) >= 2 ||
                    Math.abs(accelerometerOutput.z) >= 2) {
                    setAccelerometerOutput({ x: 0, y: 0, z: 0 });
                    setIsDeviceMotionOn(false);
                    if (lastCommand !== "") {
                        await abort();
                    }
                    return;
                }

                if (!rotation) {
                    return;
                }

                let beta = rotation.beta || 0;
                let gamma = rotation.gamma + 1.3 || 0;

                if (beta > TURN_THRESHOLD) {
                    if (lastCommand === "raw_turn_right") {
                        return;
                    }
                    await execute("raw_turn_right", COMMAND_DURATION);
                } else if (beta < -TURN_THRESHOLD) {
                    if (lastCommand === "raw_turn_left") {
                        return;
                    }
                    await execute("raw_turn_left", COMMAND_DURATION);
                } else if (gamma > DRIVE_THRESHOLD) {
                    if (lastCommand === "raw_forward") {
                        return;
                    }
                    await execute("raw_forward", COMMAND_DURATION);
                } else if (gamma < -DRIVE_THRESHOLD) {
                    if (lastCommand === "raw_back") {
                        return;
                    }
                    await execute("raw_back", COMMAND_DURATION);
                } else {
                    await abort();
                }
            });
        } else motionIncome?.remove();

        return () => motionIncome?.remove();
    }, [accelerometerOutput]);

    const execute = async (command, duration) => {
        await brokerClient.requestWithAuth(
            `/robot/${robotId}/command`,
            {
                method: "POST",
                body: JSON.stringify({
                    "CommandType": "CODE",
                    "CodeText": `${ command }(${ duration }, ${ speed })`
                })
            }
        ).then(() => {
            setLastCommand(command);
        }).catch((err) => {
            console.log(err);
        });
    };

    const abort = async () => {
        await brokerClient.requestWithAuth(
            `/robot/${robotId}/command`,
            {
                method: "POST",
                body: JSON.stringify({
                    "CommandType": "ABORT"
                })
            }
        ).then(() => {
            setLastCommand("");
            setSpeed(30);
        }).catch((err) => {
            console.log(err);
        });
    };

    const cameraClick = () => {
        if (!cameraOn) {
            Alert.alert("UPALJENA KAMERA", "Prozor u kojem se prikazuje prijenos s kamere možete podesiti njegovim povlačenjem na drugi kraj ekrana.", [ { text: "Zatvori" } ])
        }
        setCameraOn(prev => !prev);
    };

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
            gap: 10,
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
            gap: 5,
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
                    thumbColor={ isDeviceMotionOn ? "#00B6BA" : "#FFF" }
                    onValueChange={ () => {
                        setIsDeviceMotionOn(prev => !prev);
                        if(lastCommand !== "") {
                            abort();
                        }
                    }}
                    value={ isDeviceMotionOn }
                    style={{ alignSelf: "center" }}
                />
            </View>
            {/*<Text>{ lastCommand }</Text>*/}
            {/*<Text>*/}
            {/*    x: {joystickPosition.x.toFixed(2)} | y: {joystickPosition.y.toFixed(2)}*/}
            {/*</Text>*/}
            {/*<Text>{beta}</Text>*/}
            {/*<Text>{gamma}</Text>*/}
            { renderedGamePlugin && renderedGamePlugin }
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

    if (!robotId) {
        return (
            <View style={ styles.container }>
                <View style={ styles.blackView }></View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text style={{ textAlign: "center", marginBottom: 20 }}>
                        Odabir robota
                    </Text>
                    <RobotList
                        brokerClient={ brokerClient }
                        onRobotSelected={ (id) => setRobotId(id) }
                    />
                </View>
                <View style={ styles.blackView }></View>
            </View>
        );
    }

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
