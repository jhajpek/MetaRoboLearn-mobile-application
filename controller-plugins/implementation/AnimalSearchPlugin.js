import { useEffect, useRef, useState, memo } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import GamePlugin from "../GamePlugin";
import { ANIMAL_MAP } from "../../resources/AnimalData";

const PRINT_OUTPUT_WEBSOCKET_BASE_URL = Constants.expoConfig.extra.PRINT_OUTPUT_WEBSOCKET_BASE_URL;

const AnimalSearchUI = memo(({ brokerClient, robotId }) => {
    const [targets, setTargets] = useState([]);
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

    const [timeLeft, setTimeLeft] = useState(120);
    const [gameState, setGameState] = useState("IDLE");
    const [detection, setDetection] = useState("");

    const targetsRef = useRef([]);
    const currentIndexTargetRef = useRef(0);

    const wsRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!robotId) {
            return;
        }

        const socketUrl = `${PRINT_OUTPUT_WEBSOCKET_BASE_URL}/client/robot-print/${robotId}`;

        wsRef.current = new WebSocket(
            socketUrl,
            null,
            {
                headers: {
                    "client-id": brokerClient.clientId,
                    "token": brokerClient.token,
                }
            }
        );

        wsRef.current.onopen = () => {
            console.log("Print Output WS opened.");
        };

        wsRef.current.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                if (!message.Text) {
                    message.Text = "";
                }
                await handleDetectionResponse(message.Text.toLowerCase().trim());
            } catch (e) {
                console.log("Print Output WS Message Parsing Error: ", event.data);
            }
        };

        wsRef.current.onclose = () => {
            console.log("Print Output WS closed.");
            wsRef.current = null;
        };

        wsRef.current.onerror = (e) => {
            console.log("Print Output WS Error:", e.message);
            wsRef.current = null;
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [robotId]);

    const startGame = async () => {
        const randomAnimals = Object.keys(ANIMAL_MAP).sort(() => 0.5 - Math.random()).slice(0, 4);

        setTargets(randomAnimals);
        setCurrentTargetIndex(0);

        targetsRef.current = randomAnimals;
        currentIndexTargetRef.current = 0;

        setTimeLeft(120);
        setGameState("STARTED");

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopGame("LOST");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopGame = (result) => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (result) {
            setGameState(result);
        }
    };

    const sendCodeToRobot = async (code) => {
        await brokerClient.requestWithAuth(`/robot/${robotId}/command`, {
            method: "POST",
            body: JSON.stringify({ "CommandType": "CODE", "CodeText": code })
        });
    };

    const handleDetectionPress = async () => {
        setDetection(null);
        await sendCodeToRobot("print(detect_object())");
    };

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const handleDetectionResponse = async (detectedAnimal) => {
        setDetection(detectedAnimal);
        const currentTarget = targetsRef.current[currentIndexTargetRef.current];

        if (detectedAnimal === currentTarget) {
            await sendCodeToRobot("display_green()");
            await sleep(1000);
            await sendCodeToRobot("display_clear()");
            const nextIndex = currentIndexTargetRef.current + 1;

            if (nextIndex < 4) {
                setCurrentTargetIndex(nextIndex);
                currentIndexTargetRef.current = nextIndex;
            } else {
                stopGame("WON");
                await flashGreen();
            }
        } else {
            await sendCodeToRobot("display_red()");
            await sleep(1000);
            await sendCodeToRobot("display_clear()");
        }
    };

    const flashGreen = async () => {
        for (let i = 0; i < 10; i++) {
            await sendCodeToRobot(i % 2 === 0 ? "display_green()" : "display_clear()");
            await sleep(500);
        }
        await sendCodeToRobot("display_text('POBJEDA!')");
    };

    const formatTime = (timer) => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <View style={ styles.pluginContainer }>
            { gameState === "IDLE" ? (
                <TouchableOpacity style={ styles.actionButton } onPress={ startGame }>
                    <Text style={ styles.buttonText }>Kreni u potragu za životinjama!</Text>
                </TouchableOpacity>
            ) : gameState === "STARTED" ? (
                <View>
                    <Text style={ styles.timer }>Vrijeme: { formatTime(timeLeft) }</Text>
                    <Text style={styles.targetText}>Trenutno tražiš: {ANIMAL_MAP[targets[currentTargetIndex]]}</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, detection === null && { backgroundColor: "gray" }]}
                        onPress={ handleDetectionPress }
                        disabled={ detection === null }
                    >
                        { detection === null ?
                            <ActivityIndicator color="#fff" /> :
                            <Text style={ styles.buttonText }>Prepoznaj</Text>
                        }
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ alignItems: "center" }}>
                    <Text style={ styles.finalText }>{ gameState === "WON" ? "POBJEDA!" : "Više sreće drugi put..." }</Text>
                    <TouchableOpacity style={ styles.actionButton } onPress={ startGame }>
                        <Text style={ styles.buttonText }>IGRAJ PONOVNO</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.robotId === nextProps.robotId;
});

const styles = StyleSheet.create({
    pluginContainer: {
        padding: 15,
        backgroundColor: "rgba(51, 211, 214, 0.15)",
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#33D3D6"
    },
    actionButton: {
        backgroundColor: "#33D3D6",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 10
    },
    buttonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16
    },
    timer: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FF5252",
        textAlign: "center"
    },
    targetText: {
        fontSize: 18,
        color: "#FFF",
        textAlign: "center",
        marginVertical: 5
    },
    infoText: {
        color: "#FED857",
        textAlign: "center",
        marginTop: 10,
        fontWeight: "500"
    },
    finalText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#33D3D6",
        marginBottom: 10
    },
    resultText: {
        color: "#FFF",
        textAlign: "center",
        marginTop: 5
    }
});

class AnimalSearchPlugin extends GamePlugin {
    constructor() {
        super("animal-search-plugin");
    }

    render(brokerClient, robotId) {
        return <AnimalSearchUI brokerClient={ brokerClient } robotId={ robotId } />;
    }
}

export default AnimalSearchPlugin;
