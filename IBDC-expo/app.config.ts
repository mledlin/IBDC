import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * View the resolved public configuration:
 * npx expo config --type public
 *
 * Access configuration in app code through Constants.expoConfig.
 * Do not place secrets in public Expo configuration.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
    // Remove any inherited EAS project link from app.json.
    const extra = { ...config.extra };
    delete extra.eas;

    return {
        ...config,
        owner: "mledlin",

        extra: {
            ...extra,

            // After running `npx eas-cli@latest init`, add the
            // new personal project ID here if the CLI requests it:
            //
            "eas": {
                "projectId": "eec80285-5a92-4669-81c6-9859b568f679"
            },
        },

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
            "infoPlist": {
                "ITSAppUsesNonExemptEncryption": false
            },
        },

        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage:
                    "./assets/images/android-icon-foreground.png",
                backgroundImage:
                    "./assets/images/android-icon-background.png",
                monochromeImage:
                    "./assets/images/android-icon-monochrome.png",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            permissions: [
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
            "expo-dev-client",
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "Allow IBDC to use your location.",
                    androidGoogleMapsApiKey:
                        process.env.GOOGLE_MAPS_API_KEY,
                    iosGoogleMapsApiKey:
                        process.env.GOOGLE_MAPS_API_KEY,
                },
            ],
            "expo-sqlite",
            ["react-native-ble-plx"],
        ],

        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
    };
};