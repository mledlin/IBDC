import { ExpoConfig, ConfigContext } from 'expo/config';
/**
 * Use this command to view what config information will be available to end users -> npx expo config --type public
 * You should also avoid importing app.json or app.config.js directly in your JavaScript code, because this will import
 * the entire file rather than a processed version of it. Instead, use Constants.expoConfig to access the configuration.
 * This information is from -> https://docs.expo.dev/workflow/configuration/
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "IBDC-expo",
    slug: "IBDC-expo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ibdcexpo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.anonymous.IBDC-expo",
    },

    android: {
        adaptiveIcon: {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
        ],
        package: "com.anonymous.IBDCexpo",
    },

    web: {
        output: "static",
        favicon: "./assets/images/favicon.png",
    },

    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/TempMainScreen.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#ffffff",
                dark: {
                    backgroundColor: "#000000",
                },
            },

        ],
        "expo-asset",
        [
            "expo-location", // This has to do with the expo-location library and it's required permissions
            {
                locationAlwaysAndWhenInUsePermission: "Allow IBDC to use your location.",
                androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
                iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
        ],
        "expo-sqlite"
    ],

    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
});