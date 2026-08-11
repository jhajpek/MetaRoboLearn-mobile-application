import AnimalSearchPlugin from "../controller-plugins/implementation/AnimalSearchPlugin";
import AnimalQuizPlugin from "../controller-plugins/implementation/AnimalQuizPlugin";

const GAMES_DATA = [
    {
        id: 1,
        name: "Slobodna vožnja",
        description: "Ova igra pruža kontrolu nad robotom u Vašem okruženju. Moguće je upravljati robotom igraćom palicom, ali i nagibom uređaja u prostoru. Uz to, omogućen je prijenos uživo s kamere robota.",
        plugin: null
    },
    {
        id: 2,
        name: "Zoo tražilica",
        description: "Osim karakteristika poput upravljanja robotom i prijenosa uživo s kamere robota koje pruža igra Slobodna vožnja, u ovoj igri možete tražiti životinje do isteka vremena koji je predviđen za to.",
        plugin: AnimalSearchPlugin
    },
    {
        id: 3,
        name: "Zoo kviz",
        description: "Osim karakteristika poput upravljanja robotom i prijenosa uživo s kamere robota koje pruža igra Slobodna vožnja, u ovoj igri možete pronaći životinju te zaigrati kviz o toj vrsti životinja.",
        plugin: AnimalQuizPlugin
    }
];

export default GAMES_DATA;
