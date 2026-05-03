import ObjectDetectionPlugin from "../controller-plugins/implementation/ObjectDetectionPlugin";

const GAMES_DATA = [
    {
        id: 1,
        name: "Slobodna vožnja",
        description: "Ova igra pruža kontrolu nad robotom u Vašem okruženju. Moguće je upravljati robotom tipkama te kontrolirati njegovo skretanje žiroskopom. Uz to, omogućen je prijenos uživo s kamere robota.",
        plugin: null
    },
    {
        id: 2,
        name: "Prepoznavanje objekata",
        description: "Osim karakteristika poput upravljanja robotom i prijenosa uživo s kamere robota koje pruža igra Slobodna vožnja, u ovoj igri možete tražiti objekte do isteka vremena koji je predviđen za to.",
        plugin: ObjectDetectionPlugin
    },
];

export default GAMES_DATA;
