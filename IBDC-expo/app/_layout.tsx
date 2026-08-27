/**
 * Root layout and navigation setup for the application.
 *
 * This file is responsible for:
 * - Creating the app-wide navigation stack.
 * - Initializing the local database when the app starts.
 * - Applying the active theme to the navigation header.
 * - Wrapping the app in the required context providers.
 */

import { Stack } from "expo-router";
import { DeviceProvider } from "@/context/DeviceContext";
import { View, Text, Image } from "react-native";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { initDatabase } from "@/database/database";
import { useEffect } from "react";
import {BleManager} from "react-native-ble-plx";

// Global reference point to the device's Bluetooth peripherals. Any module can use -> import {bleManager} from _layout.tsx
export const bleManager = new BleManager();


/**
 * Builds the application's navigation stack.
 *
 * This component reads the active theme from ThemeContext, initializes the database
 * on first render, and defines the shared header styling and available screens
 * for the app's stack navigator.
 *
 * The database initialization runs once when this component mounts.
 * If initialization fails, an error is logged to the console.
 *
 * @returns The configured stack navigator for the app.
 */
function AppStack() {
    const { theme } = useTheme();
    useEffect(() => {
        /**
         * Initializes the local database used by the application.
         *
         * This function is called once when the stack is first mounted.
         * It prepares the database so the rest of the app can safely
         * read and write stored data.
         */
        async function setupDatabase() {
            try {
                await initDatabase();
                console.log("Database Init");
            } catch (error) {
                console.error("Database init failed", error);
            }
        }
        setupDatabase();
    }, []);
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                },
                headerTitleAlign: "center",
                headerTintColor: theme.colors.returnArrow,
                headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 18,
                },
                headerShadowVisible: false,
                headerLargeTitleEnabled: true,

                /**
                 * Header title shown at the top of each screen.
                 */
                headerTitle: () => (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingBottom: 30,
                            paddingTop: 50,
                        }}
                    >
                        <Image
                            source={require("../assets/images/logo.png")}
                            style={{ width: 24, height: 24 }}
                        />
                        <Text
                            style={{
                                fontWeight: "700",
                                fontSize: 18,
                                color: "#0F172A",
                            }}
                        >
                            IBDC
                        </Text>
                    </View>
                ),
            }}
        >
            {/* Main screen for the app */}
            <Stack.Screen name="MainScreen" options={{ title: "" }} />

            {/* Screen to view details for a selected incident */}
            <Stack.Screen name="IncidentDetail" options={{ title: "" }} />

            {/* Screen used to pair with a device */}
            <Stack.Screen name="PairDevice" options={{ title: "" }} />

            {/* Screen used to view ride sessions */}
            <Stack.Screen name="RideSessions" options={{ title: "" }} />

            {/* Screen used to manage app settings */}
            <Stack.Screen name="Settings" options={{ title: "" }} />
        </Stack>
    );
}

/**
 * Top-level layout component for the app.
 *
 * This component wraps the navigation stack in the providers
 * required by the application:
 *
 * ThemeProvider:
 * - Supplies theme values and styling across the app.
 *
 * DeviceProvider:
 * - Supplies shared device-related state and behavior.
 *
 * The AppStack is placed inside these providers so all screens
 * can access theme and device context data.
 *
 * @returns The wrapped application layout.
 */
export default function AppLayout() {
    return (
        <ThemeProvider>
            <DeviceProvider>
                <AppStack />
            </DeviceProvider>
        </ThemeProvider>
    );
}
