import { enableScreens } from "react-native-screens";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Platform, StatusBar } from "react-native";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import Home from "./pages/Home";
import Games  from "./pages/Games";
import Controller from "./pages/Controller";

enableScreens();
const Routes = createStackNavigator();

export default function App() {

    useEffect(() => {
        const hideNavigationBar = async () => {
            if(Platform.OS === "android") {
                await NavigationBar.setBehaviorAsync("inset-swipe");
                await NavigationBar.setVisibilityAsync("hidden");
            }
        };

        hideNavigationBar().then().catch();
    }, []);

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar hidden={ true } />
                <Routes.Navigator id={ undefined } initialRouteName="Home"
                                  screenOptions={{ headerShown: false }}>
                    <Routes.Screen name="Home" component={ Home } />
                    <Routes.Screen name="Games" component={ Games } />
                    <Routes.Screen name="Controller" component={ Controller } />
                </Routes.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};
