import { render, fireEvent } from "@testing-library/react-native";
import Controller from "../pages/Controller";

jest.mock("react-native-safe-area-context", () => ({
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({
        navigate: mockNavigate
    })
}));

global.WebSocket = jest.fn().mockImplementation(() => ({}));

jest.mock("expo-constants", () => ({
    expoConfig: { extra: {} }
}));

jest.mock("../components/RobotList", () => {
    const { TouchableOpacity, Text } = require("react-native");
    return ({ onRobotSelected }) => (
        <TouchableOpacity testId="robot-item" onPress={() => onRobotSelected(1)}>
            <Text>Robot with Id 1</Text>
        </TouchableOpacity>
    );
});

const mockRoute1 = {
    params: {
        gameId: 1
    }
}

const mockRoute2 = {
    params: {
        gameId: 2
    }
}

const mockRoute3 = {
    params: {
        gameId: 3
    }
}

describe("Controller page", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    it("Successfully renders plugin for gameId: 1 and changes controller view depending on user's hand preference", () => {
        const { getByText } = render(<Controller route={ mockRoute1 } />);

        fireEvent.press(getByText("Robot with Id 1"));

        const rightButton1 = getByText("Dešnjak");
        expect(rightButton1).toBeTruthy();

        fireEvent.press(getByText("Dešnjak"));

        const leftButton1 = getByText("Ljevak");
        expect(leftButton1).toBeTruthy();

        fireEvent.press(getByText("Ljevak"));

        const rightButton2 = getByText("Dešnjak");
        expect(rightButton2).toBeTruthy();
    });

    it("Successfully renders plugin for gameId: 2", () => {
        const { getByText } = render(<Controller route={ mockRoute2 } />);

        fireEvent.press(getByText("Robot with Id 1"));

        const pluginElement = getByText("Kreni u potragu za životinjama!");
        expect(pluginElement).toBeTruthy();
    });

    it("Successfully renders plugin for gameId: 3", () => {
        const { getByText } = render(<Controller route={ mockRoute3 } />);

        fireEvent.press(getByText("Robot with Id 1"));

        const pluginElement = getByText("Pozdravi životinju");
        expect(pluginElement).toBeTruthy();
    });
});
