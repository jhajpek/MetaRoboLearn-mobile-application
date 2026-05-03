import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";

const RobotList = ({ brokerClient, onRobotSelected }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [robots, setRobots] = useState([]);
    const [selectedId, setSelectedId] = useState("");

    useEffect(() => {
        const fetchRobots = async () => {
            try {
                const response = await brokerClient.requestWithAuth("/client/robot/info");
                const robots = await response.json();
                const activeRobots = robots.filter(r => r.IsActivated);
                setRobots(activeRobots);
            } catch (err) {
                console.error("An error occurred while fetching for robot info:", err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRobots();
    }, []);

    if (isLoading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Odaberi aktivnog robota:</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedId}
                    onValueChange={(itemValue) => {
                        setSelectedId(itemValue);
                        onRobotSelected(itemValue);
                    }}
                >
                    {robots.length > 0 ? (
                        robots.map((robot) => (
                            <Picker.Item
                                key={robot.RobotId}
                                label={robot.Name}
                                value={robot.RobotId}
                            />
                        ))
                    ) : (
                        <Picker.Item label="Nema aktivnih robota" value="" />
                    )}
                </Picker>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 10, paddingHorizontal: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9' }
});

export default RobotList;
