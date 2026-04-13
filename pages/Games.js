import { StyleSheet, Dimensions, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import Triangles from "../components/Triangles";
import Game from "../components/Game";
import Footer from "../components/Footer";


const { height: HEIGHT, width: WIDTH } = Dimensions.get("screen");
const GAMES = [
    {
        id: 1,
        name: "Slobodna vožnja",
        description: "Ova igra pruža kontrolu nad robotom u Vašem okruženju. Moguće je upravljati robotom tipkama te kontrolirati njegovo skretanje žiroskopom. Uz to, omogućen je prijenos uživo s kamere robota.",
        params: null
    },
    {
        id: 2,
        name: "Prepoznavanje objekata",
        description: "Osim karakteristika poput upravljanja robotom i prijenosa uživo s kamere robota koje pruža igra Slobodna vožnja, u ovoj igri možete tražiti objekte do isteka vremena koji je predviđen za to.",
        params: null
    },
];


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
                    <FlatList data={ GAMES }
                              keyExtractor={ (game) => game.id }
                              horizontal={ true }
                              showsHorizontalScrollIndicator={ false }
                              contentContainerStyle={ styles.list }
                              renderItem={({ item }) => (
                                  <Game name={ item.name } description={ item.description } />
                              )} />
                </View>
                <Footer />
            </View>
            <View style={ styles.blackView }></View>
        </View>
    );
};

export default Games;
