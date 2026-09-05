/**
 * Main dashboard screen for the app.
 *
 * This screen shows a quick overview of device status,
 * battery level, storage usage and navigation actions
 * for pairing, viewing sessions, and opening settings.
 */

import {View, Text, StyleSheet, Pressable, ScrollView, Image} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import React from "react";
import {Ionicons} from '@expo/vector-icons';
import {useDevice} from "@/context/DeviceContext";
import {useTheme} from '@/context/ThemeContext';

type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

/**
 * Describes the data shown for the current device.
 */
interface DeviceInfo {
    name: string;
    status: ConnectedStatus;
    battery: number;
    storage: { used: number; total: number };
    firmwareVersion: string;
    lastSynced: string;
}

/**
 * DEBUG DATA
 *
 * Temporary fallback device data used when no real device
 * is currently available from context.
 */
const demoDevice: DeviceInfo = {
    name: 'IBDC Proto X',
    status: 'connected',
    battery: 78,
    storage: {used: 3.4, total: 8},
    firmwareVersion: 'v1.0',
    lastSynced: '2 min ago',
};

/**
 * Displays a simple horizontal battery bar.
 *
 * The fill color changes based on remaining battery level.
 *
 * @param level Battery percentage from 0 to 100.
 * @param theme Current theme object.
 * @returns A battery progress bar.
 */
function BatteryBar({level, theme}: { level: number; theme: any }) {
    const color = level > 50 ? '#16a34a' : level > 20 ? '#ffd166' : '#ff6b6b';
    return (
        <View style={styles.batteryWrapper}>
            <View style={[styles.batteryOuter, {backgroundColor: theme.colors.border}]}>
                <View style={[styles.batteryFill, {width: `${level}%` as any, backgroundColor: color}]}/>
            </View>
        </View>
    );
}

/**
 * Displays a simple storage usage bar.
 *
 * The fill color changes based on how full the storage is.
 *
 * @param level Storage percentage from 0 to 100.
 * @param theme Current theme object.
 * @returns A storage progress bar view.
 */
function StorageBar({level, theme}: { level: number; theme: any }) {
    const color = level > 90 ? '#ff6b6b' : level > 70 ? '#ffd166' : '#16a34a';
    return (
        <View style={styles.batteryWrapper}>
            <View style={[styles.batteryOuter, {backgroundColor: theme.colors.border}]}>
                <View style={[styles.batteryFill, {width: `${level}%` as any, backgroundColor: color}]}/>
            </View>
        </View>
    );
}

/**
 * Converts a status value into user-facing text.
 *
 * @param status The device connection status.
 * @returns A label for display in the UI.
 */
function getStatusText(status: ConnectedStatus) {
    switch (status) {
        case "connected":
            return "Connected";
        case "pairing":
            return "Pairing";
        case "disconnected":
            return "Disconnected";
        default:
            return "Unknown";
    }
}

/**
 * Renders the main dashboard screen.
 *
 * This component:
 * - Retrieves the current theme.
 * - Reads safe area spacing.
 * - Gets the current device from context.
 * - Falls back to demo data when needed.
 * - Displays key device information with navigation actions.
 *
 * @returns The main application home screen.
 */
export default function MainScreen() {
    const {theme} = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {device} = useDevice();
    const currentDevice = device ?? demoDevice;
    const storagePercent = (currentDevice.storage.used / currentDevice.storage.total) * 100;

    return (
        <View style={[styles.safe, {paddingTop: insets.top, backgroundColor: theme.colors.background}]}>
            <ScrollView
                style={{paddingTop: insets.top}}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Stat cards row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border
                    }]}>
                        <View style={styles.statHeader}>
                            <Ionicons name="bluetooth" size={18} color={theme.colors.primary}/>
                            <Text
                                style={[styles.statTitle, {color: theme.colors.textSecondary}]}>{getStatusText(currentDevice.status)}</Text>
                        </View>
                        <Pressable
                            style={[styles.button, {
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.radii.md
                            }]}
                            onPress={() => router.push("/PairDevice")}
                        >
                            <Text style={[styles.buttonText, {color: theme.colors.primaryForeground}]}>Pair
                                Device</Text>
                        </Pressable>
                    </View>

                    <View style={[styles.statCard, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border
                    }]}>
                        <View style={styles.statHeader}>
                            <Ionicons name="battery-half-outline" size={18} color={theme.colors.textSecondary}/>
                            <Text style={[styles.statTitle, {color: theme.colors.textSecondary}]}>Battery</Text>
                        </View>
                        <Text
                            style={[styles.statBigNumber, {color: theme.colors.textSecondary}]}>{currentDevice.battery}%</Text>
                        <BatteryBar level={currentDevice.battery} theme={theme}/>
                    </View>

                    <View style={[styles.statCard, {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border
                    }]}>
                        <View style={styles.statHeader}>
                            <Ionicons name="server-outline" size={18} color={theme.colors.textSecondary}/>
                            <Text style={[styles.statTitle, {color: theme.colors.textSecondary}]}>Storage</Text>
                        </View>
                        <Text
                            style={[styles.statBigNumber, {color: theme.colors.textSecondary}]}>{storagePercent}%</Text>
                        <StorageBar level={storagePercent} theme={theme}/>
                    </View>
                </View>

                {/* Device image card */}
                <View style={[styles.imageCard, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                }]}>
                    <Text style={[styles.batteryText, {color: theme.colors.text}]}>IBDC</Text>
                    <Image
                        source={require('../assets/images/device-placeholder.png')}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                    <Text style={[styles.batteryText, {color: theme.colors.textSecondary}]}>
                        Firmware {currentDevice.firmwareVersion} • Synced {currentDevice.lastSynced}
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom navigation */}
            <View style={[styles.bottomNav, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, 8)
            }]}>
                <Pressable
                    style={styles.navItem}
                    onPress={() => router.push("/RideSessions")}
                >
                    <Ionicons
                        name="bicycle-outline"
                        size={24}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.navText, {color: theme.colors.textSecondary}]}>
                        Ride Sessions
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.navItem}
                    onPress={() => router.push("/MainScreen")}
                >
                    <Ionicons
                        name="home"
                        size={24}
                        color={theme.colors.primary}
                    />
                    <Text style={[styles.navText, {color: theme.colors.primary}]}>
                        Home
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.navItem}
                    onPress={() => router.push("/Settings")}
                >
                    <Ionicons
                        name="settings-outline"
                        size={24}
                        color={theme.colors.textSecondary}
                    />
                    <Text style={[styles.navText, {color: theme.colors.textSecondary}]}>
                        Settings
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {flex: 1},
    scroll: {flex: 1},
    content: {padding: 20, paddingBottom: 30},
    topRow:{width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 12},
    metricRow: {width:"100%", flexDirection: "row", justifyContent: "space-between", marginBottom: 18, paddingHorizontal: 30},
    connectStatus: {flexDirection: "row", alignItems: "center", gap: 6},
    connectedDot: {width: 8, height: 8, borderRadius: 4},
    connectionText: {fontSize: 12, fontWeight: "600"},
    pairButton: {marginLeft: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4},
    pairText: {fontSize: 12, fontWeight: "700"},
    deviceMetric: {width:100, marginBottom: 18},
    metricHead: {flexDirection: "row", alignItems: "center", marginBottom: 8 },
    metricLabel: {flexDirection: "row", alignItems: "center", gap: 6},
    metricTitle: {fontSize: 13, fontWeight: "600"},
    metricValue: {fontsize: 15, fontweight: "800", marginLeft: 5},
    deviceMeta: {fontsize: 11, fontWeight: "600", marginTop: 2},
    batteryWrapper: {flexDirection: 'row', alignItems: 'center', gap: 8},
    batteryOuter: {flex: 1, height: 8, borderRadius: 4, overflow: 'hidden'},
    batteryFill: {height: '100%', borderRadius: 4},
    batteryText: {fontSize: 11, fontWeight: '700'},
    button: {padding: 12, marginBottom: 4},
    buttonText: {fontWeight: 'bold', textAlign: 'center'},
    imageCard: {
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        paddingTop: 22,
        paddingHorizontal: 16,
        paddingBottom: 28,
        marginBottom: 18,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        elevation: 5,
    },
    productImage: {width: '100%', height: 290, marginBottom: 18},
    bottomNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderTopWidth: 1,
        paddingTop: 10,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: -2},
        elevation: 10,
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        gap: 3,
    },
    navText: {
        fontSize: 11,
        fontWeight: "600",
    },
});