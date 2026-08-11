import { useEffect, useRef, useState, memo } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import GamePlugin from "../GamePlugin";
import { ANIMAL_MAP, ANIMAL_QUESTIONS } from "../../resources/AnimalData";

const PRINT_OUTPUT_WEBSOCKET_BASE_URL = Constants.expoConfig.extra.PRINT_OUTPUT_WEBSOCKET_BASE_URL;

const AnimalQuizUI = memo(({ brokerClient, robotId }) => {
    const [gameState, setGameState] = useState("SCANNING");
    const [detection, setDetection] = useState("");
    const [lastDetected, setLastDetected] = useState(null);

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizResult, setQuizResult] = useState(null);
    const [score, setScore] = useState(0);

    const wsRef = useRef(null);

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

        wsRef.current.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.Text) {
                    const animalKey = message.Text.toLowerCase().trim();
                    if (ANIMAL_MAP[animalKey]) {
                        setLastDetected(animalKey);
                        setGameState("GREETING");
                        setDetection(ANIMAL_MAP[animalKey]);
                    }
                }
            } catch (e) { console.log("WS Error"); }
        };

        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [robotId]);

    const sendCode = async (code) => {
        await brokerClient.requestWithAuth(`/robot/${robotId}/command`, {
            method: "POST",
            body: JSON.stringify({ "CommandType": "CODE", "CodeText": code })
        });
    };

    const startQuiz = () => {
        const allQuestions = [...ANIMAL_QUESTIONS[lastDetected]].sort(() => 0.5 - Math.random());
        setQuestions(allQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setGameState("QUIZ");
    };

    const handleAnswer = async (userAnswer) => {
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = currentQ.a === userAnswer;

        setQuizResult(isCorrect ? "CORRECT" : "WRONG");
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        await sendCode(isCorrect ? "display_green()" : "display_red()");

        setTimeout(async () => {
            await sendCode("display_clear()");
            setQuizResult(null);

            if (currentQuestionIndex + 1 < questions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setGameState("FINISHED");
            }
        }, 1500);
    };

    const reset = () => {
        setGameState("SCANNING");
        setLastDetected(null);
        setDetection("");
    };

    return (
        <View style={styles.pluginContainer}>
            { gameState === "SCANNING" && (
                <View>
                    <Text style={styles.infoText}>Pronađi životinju kamerom!</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, detection === null && { backgroundColor: "gray" }]}
                        onPress={ async () => { setDetection(null); await sendCode("print(detect_object())"); }}
                        disabled={ detection === null }
                    >
                        { detection === null ?
                            <ActivityIndicator color="#FFF" /> :
                            <Text style={ styles.buttonText }>Pozdravi životinju</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}

            { gameState === "GREETING" && (
                <View style={{ alignItems: "center" }}>
                    <Text style={styles.targetText}>
                        { ANIMAL_MAP[lastDetected].charAt(0).toUpperCase() + ANIMAL_MAP[lastDetected].slice(1) } kaže bok!
                    </Text>
                    <Text style={styles.infoText}>Želiš li odgovoriti na { ANIMAL_QUESTIONS[lastDetected].length } pitanja?</Text>
                    <View style={{ flexDirection: "row", gap: 5 }}>
                        <TouchableOpacity style={ styles.actionButton } onPress={ startQuiz }>
                            <Text style={ styles.buttonText }>DA!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#ff5252" }]} onPress={ reset }>
                            <Text style={ styles.buttonText }>NE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            { gameState === "QUIZ" && questions[currentQuestionIndex] && (
                <View>
                    <Text style={ styles.progressText }>Pitanje { currentQuestionIndex + 1 } / { questions.length }</Text>
                    <Text style={ styles.questionBox }>{ questions[currentQuestionIndex].q }</Text>

                    { quizResult === null ? (
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.answerButton, { backgroundColor: "#4CAF50" }]} onPress={() => handleAnswer("da")}>
                                <Text style={styles.buttonText}>DA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.answerButton, { backgroundColor: "#f44336" }]} onPress={() => handleAnswer("ne")}>
                                <Text style={styles.buttonText}>NE</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={[styles.resultText, { color: quizResult === "CORRECT" ? "#4CAF50" : "#f44336" }]}>
                            { quizResult === "CORRECT" ? "TOČNO!" : "NETOČNO!" }
                        </Text>
                    )}
                </View>
            )}

            { gameState === "FINISHED" && (
                <View style={{ alignItems: "center" }}>
                    <Text style={ styles.scoreText }>Rezultat: { score } / { questions.length }</Text>
                    <TouchableOpacity style={ styles.actionButton } onPress={ reset }>
                        <Text style={ styles.buttonText }>Potraži drugu životinju</Text>
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
        borderRadius: 15,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#33D3D6"
    },
    actionButton: {
        backgroundColor: "#33D3D6",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 5,
        minWidth: 100
    },
    answerButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal: 5
    },
    buttonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 15
    },
    targetText: {
        fontSize: 20,
        color: "#FFF",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 10
    },
    questionBox: {
        color: "#FED857",
        textAlign: "center",
        fontSize: 20,
        marginBottom: 15,
        fontWeight: "500",
        minHeight: 50
    },
    progressText: {
        color: "#33D3D6",
        textAlign: "center",
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 5
    },
    infoText: {
        color: "#EEE",
        textAlign: "center",
        marginBottom: 10,
        fontSize: 15
    },
    row: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10
    },
    resultText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10
    },
    scoreBadge: {
        backgroundColor: "rgba(254, 216, 87, 0.2)",
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 10
    },
    scoreText: {
        fontSize: 20,
        color: "#FED857",
        fontWeight: "bold"
    }
});

class AnimalQuizPlugin extends GamePlugin {
    constructor() {
        super("animal-quiz-plugin");
    }

    render(brokerClient, robotId) {
        return <AnimalQuizUI brokerClient={ brokerClient } robotId={ robotId } />;
    }
}

export default AnimalQuizPlugin;
