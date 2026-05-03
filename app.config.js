import "dotenv/config";

export default {
    expo: {
        name: "MetaRoboLearn",
        slug: "metarobolearn",
        version: "1.0.0",
        orientation: "landscape",
        icon: "./assets/logo-black.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/logo-black.png",
            resizeMode: "contain",
            backgroundColor: "#FFF",
        },
        android: {
            package: "com.jhajpek.MetaRoboLearn",
            adaptiveIcon: {
                foregroundImage: "./assets/logo-black.png",
            }
        },
        ios: {
            supportsTablet: true
        },
        web: {
            favicon: "./assets/logo-black.png",
        },
        extra: {
            eas: {
                projectId: process.env.EXPO_PROJECT_ID,
            },
            CLIENT_NAME: process.env.CLIENT_NAME,
            API_KEY: process.env.API_KEY,
            BROKER_HTTP_API_BASE_URL: process.env.BROKER_HTTP_API_BASE_URL,
            PRINT_OUTPUT_WEBSOCKET_BASE_URL: process.env.PRINT_OUTPUT_WEBSOCKET_BASE_URL,
            CAMERA_FEED_WEBSOCKET_BASE_URL: process.env.CAMERA_FEED_WEBSOCKET_BASE_URL
        }
    }
};
