import { render, fireEvent } from "@testing-library/react-native";
import Games from "../pages/Games";
import GAMES_DATA from "../resources/GamesData";

jest.mock("react-native-safe-area-context", () => ({
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock("expo-constants", () => ({
    expoConfig: { extra: {} }
}));

global.WebSocket = jest.fn().mockImplementation(() => ({}));

describe("Games Page", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("Successfully renders all games from GAMES_DATA", () => {
        const { getAllByText } = render(<Games />);
        const playButtons = getAllByText("Zaigraj!");
        expect(playButtons).toHaveLength(GAMES_DATA.length);
    });

    it("Displays names of the games correctly", () => {
        const { getByText } = render(<Games />);
        expect(getByText(GAMES_DATA[0].name)).toBeTruthy();
    });

    it("Navigates to Controller when 'Zaigraj!' is pressed", () => {
        const { getAllByText } = render(<Games />);
        const playButtons = getAllByText("Zaigraj!");

        fireEvent.press(playButtons[0]);
        expect(mockNavigate).toHaveBeenCalled();
    });
});
