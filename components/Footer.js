import { View, Text, StyleSheet, Linking, Dimensions, TouchableOpacity } from "react-native";

const HEIGHT = Dimensions.get("screen").height * 0.085;

const Footer = () => {

    const styles = StyleSheet.create({
        container: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 200, 204, 0.4)",
            padding: 5,
            zIndex: 1,
            height: HEIGHT,
        },
    });

    return (
        <View style={styles.container}>
            <Text style={{ color: "#FFF" }}>Napravljeno u suradnji s </Text>
            <TouchableOpacity onPress={ () => Linking.openURL("https://www.fer.unizg.hr/") }>
                <Text style={{ color: "#FFF", textDecorationLine: "underline" }}>
                    Fakultetom elektrotehnike i računarstva
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Footer;
