import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect, useRef, useState } from "react";
import Constants from "expo-constants";
import GamePlugin from "../GamePlugin";

const PRINT_OUTPUT_WEBSOCKET_BASE_URL = Constants.expoConfig.extra.PRINT_OUTPUT_WEBSOCKET_BASE_URL;

const ObjectDetectionUI = ({ brokerClient, robotId }) => {
    const [detection, setDetection] = useState(null);
    const [text, setText] = useState("FER");
    const ws = useRef(null);

    useEffect(() => {
        if (!robotId) {
            return;
        }

        const socketUrl = `${PRINT_OUTPUT_WEBSOCKET_BASE_URL}/client/robot-print/${robotId}`;

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
            console.log("Print Output WS opened.");
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.Text) {
                    setDetection(message.Text);
                }
            } catch (e) {
                console.log("Print Output WS Message Parsing Error: ", event.data);
            }
        };

        ws.current.onclose = () => {
            console.log("Print Output WS closed.");
        };

        ws.current.onerror = (e) => {
            console.log("Print Output WS Error:", e.message);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [robotId]);

    const handleDetection = async () => {
        setDetection("");
        await brokerClient.requestWithAuth(`/robot/${robotId}/command`, {
            method: "POST",
            body: JSON.stringify({
                "CommandType": "CODE",
                "CodeText": "print(detect_object())"
            })
        });
    };

    const handleDisplay = async () => {
        await brokerClient.requestWithAuth(`/robot/${robotId}/command`, {
            method: "POST",
            body: JSON.stringify({
                "CommandType": "CODE",
                "CodeText": `display_text('${text}')`
            })
        });
    };

    return (
        <View style={styles.pluginContainer}>
            <TouchableOpacity
                style={[styles.actionButton, detection === "" && { backgroundColor: 'gray' }]}
                onPress={handleDetection}
                disabled={detection === ""}
            >
                <Text style={styles.buttonText}>
                    {detection === "" ? "Pričekajte rezultat..." : "Prepoznaj objekt"}
                </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 10, alignItems: 'center' }}>
                {detection === "" ? (
                    <ActivityIndicator size="large" color="#33D3D6" />
                ) : detection !== null ? (
                    <Text style={styles.resultText}>Pronađeno: {detection}</Text>
                ) : (
                    <Text style={{ color: '#aaa' }}>Nema skeniranih objekata</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDisplay}
            >
                <Text style={styles.buttonText}>Display FER</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    pluginContainer: { padding: 10, backgroundColor: 'rgba(51, 211, 214, 0.2)', borderRadius: 10, marginTop: 10 },
    pluginTitle: { fontWeight: 'bold', color: '#33D3D6', marginBottom: 5 },
    actionButton: { backgroundColor: '#33D3D6', padding: 8, borderRadius: 5, alignItems: 'center' },
    buttonText: { color: '#FFF', fontWeight: 'bold' }
});

class ObjectDetectionPlugin extends GamePlugin {
    constructor() {
        super("object-detection-plugin");
    }

    render(brokerClient, robotId) {
        return <ObjectDetectionUI brokerClient={brokerClient} robotId={robotId} />;
    }
}

export default ObjectDetectionPlugin;
