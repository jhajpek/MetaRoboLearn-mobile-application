import { StyleSheet, Dimensions, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import Triangles from "../components/Triangles";
import Game from "../components/Game";
import Footer from "../components/Footer";
import GAMES_DATA from "../resources/GamesData";

const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");

const Games = () => {
    const insets = useSafeAreaInsets();
    const styles = StyleSheet.create({
        container: {
            display: "flex",
            flexDirection: "row",
            width: WIDTH,
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
        list: {
            gap: WIDTH * 0.2 - insets.left,
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: WIDTH * 0.2 - insets.left,
            paddingRight: WIDTH * 0.2 - insets.left,
        },
    });

    return (
        <View style={ styles.container }>
            <View style={ styles.blackView }></View>
            <View style={ styles.container2 }>
                <Header forLogin={ false } />
                <View style={ styles.body }>
                    <Triangles trianglesHeight={ HEIGHT * 0.745 } />
                    <FlatList data={ GAMES_DATA }
                              keyExtractor={ (game) => game.id }
                              horizontal={ true }
                              showsHorizontalScrollIndicator={ false }
                              contentContainerStyle={ styles.list }
                              renderItem={({ item }) => (
                                  <Game id={ item.id }
                                        name={ item.name }
                                        description={ item.description }
                                  />
                              )}
                    />
                </View>
                <Footer />
            </View>
            <View style={ styles.blackView }></View>
        </View>
    );
};

export default Games;
