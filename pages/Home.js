import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import Triangles from "../components/Triangles";
import JumpingRobot from "../components/JumpingRobot";
import Footer from "../components/Footer";

const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");

const Home = () => {
    const insets = useSafeAreaInsets()
    const styles = StyleSheet.create({
        container: {
            display: "flex",
            flexDirection: "row",
        },
        blackView: {
            height: HEIGHT,
            width: insets.left,
            backgroundColor: "black",
        },
        container2: {
            display: "flex",
            flexDirection: "column",
            width: WIDTH - insets.left * 2,
            backgroundColor: "rgba(0, 200, 204, 0.4)",
        },
        body: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            position: "relative",
            height:  HEIGHT * 0.745,
        },
        titleContainer: {
            alignItems: "center",
        },
        title: {
            fontSize: 48,
            fontWeight: "bold",
            textAlign: "center",
            color: "#FFF",
            marginBottom: 20,
            textShadowColor: "rgba(0, 0, 0, 0.8)",
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4
        },
    });

    return (
        <View style={ styles.container }>
            <View style={ styles.blackView }></View>
            <View style={ styles.container2 }>
                <Header forLogin={ true } />
                <View style={ styles.body }>
                    <Triangles trianglesHeight={ HEIGHT * 0.745 } />
                    <View style={ styles.titleContainer }>
                        <Text style={ styles.title }>
                            {"Dobrodošli u\nMetaRoboLearn\nsvijet!"}
                        </Text>
                    </View>
                    <JumpingRobot />
                </View>
                <Footer />
            </View>
            <View style={ styles.blackView }></View>
        </View>
    );
};

export default Home;
