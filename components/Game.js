import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");
const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "column",
        height: HEIGHT * 0.745 * 0.9,
        width: WIDTH * 0.6,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#00B6BA",
        borderStyle: "solid",
        backgroundColor: "rgba(0, 200, 204, 0.6)",
        zIndex: 1,
    },
    title: {
        height: "20%",
        fontSize: 36,
        color: "#FFF",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        textAlign: "center",
        textAlignVertical: "center",
    },
    hr: {
        borderBottomColor: "#00B6BA",
        borderBottomWidth: 3,
    },
    descriptionAndPlay: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "80%",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    button: {
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: "#FFF",
        borderStyle: "solid",
        width: WIDTH / 3,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "600",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        textAlign: "center",
        textAlignVertical: "center",
    },
    descriptionText: {
        color: "#FFF",
        fontSize: 16,
        textAlign: "center",
        textAlignVertical: "center",
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});

const Game = ({ id, name, description }) => {
    const navigation = useNavigation();

    return (
        <View style={ styles.container }>
            <Text style={ styles.title }>{ name }</Text>

            <View style={ styles.hr } />

            <View style={ styles.descriptionAndPlay }>
                <Text style={ styles.descriptionText }>{ description }</Text>

                <TouchableOpacity
                    style={ styles.button }
                    onPress={ () => navigation.navigate("Controller", { gameId: id }) }
                >
                    <Text style={ styles.buttonText }>Zaigraj!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Game;
