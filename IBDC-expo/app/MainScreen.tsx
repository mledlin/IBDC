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
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Device image card */}
                <View style={[styles.imageCard, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                }]}>
                    <View style={styles.topRow}>
                    <Pressable
                        style={styles.connectStatus}
                        onPress={() => router.push("/PairDevice")}
                    >
                        <View 
                            style ={[
                                styles.connectedDot,
                                {
                                    backgroundColor:
                                    currentDevice.status === "connected"
                                    ? "#16a34a"
                                    : currentDevice.status === "pairing"
                                    ? "#0961d4"
                                    : "#ef4444"
                                }
                                ]}
                            />
                            <Ionicons
                                name="bluetooth"
                                size={16}
                                color={theme.colors.textSecondary}
                                />
                            <Text 
                                style={[
                                    styles.connectionText,
                                    {color: theme.colors.textSecondary}
                                    ]}
                                >
                                {getStatusText(currentDevice.status)}
                            </Text>
                            <Text 
                                style={[
                                    styles.pairText,
                                    {color: theme.colors.primary}                               
                                    ]}
                                >
                                    Pair Device
                            </Text>
                        </Pressable>
                    </View>
                    
                    <Text style={[styles.batteryText, {color: theme.colors.text}]}>IBDC</Text>
                    <Image
                        source={require('../assets/images/device-placeholder.png')}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                    {/* Battery status */}
                    <View style={styles.metricRow}>
                    <View style={styles.deviceMetric}>
                        <View style={styles.metricHead}>
                            <View style={styles.metricLabel}>
                            <Ionicons
                                name="battery-half-outline"
                                size={18}
                                color={theme.colors.textSecondary}
                                />
                            <Text
                                style={[
                                    styles.metricTitle,
                                    {color: theme.colors.textSecondary}
                                ]}>
                                    Battery
                                    </Text>
                                   </View>
                        <Text
                            style={[
                                styles.metricValue,
                                {color: theme.colors.text}
                            ]}>
                                {currentDevice.battery}%
                        </Text>
                        </View>
                    <BatteryBar
                        level={currentDevice.battery}
                        theme={theme}
                        />
                    </View>

                    {/* Storage status */}
                    <View style={styles.deviceMetric}>
                        <View style={styles.metricHead}>
                            <View style={styles.metricLabel}>
                                <Ionicons
                                name="server-outline"
                                size={18}
                                color={theme.colors.textSecondary}
                                />
                                <Text
                                style={[
                                    styles.metricTitle,
                                    {color: theme.colors.textSecondary}
                                ]} >
                                    Storage
                                    </Text>
                                </View>
                                <Text 
                                    style={[
                                        styles.metricValue,
                                        {color: theme.colors.text}
                                    ]} >
                                        {Math.round(storagePercent)}%
                                        </Text>
                                </View>
                                <StorageBar
                                    level={storagePercent}
                                    theme={theme}
                                    />
                                </View>
                                </View>
                                <Text
                                style ={[
                                    styles.deviceMeta,
                                    {color: theme.colors.textSecondary}                 
                                ]}
                                >
                                    Firmware {currentDevice.firmwareVersion} • Synced {currentDevice.lastSynced}
                    </Text>
                </View>
                {/* Action buttons */}
                <View style={[styles.actionsCard, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                }]}>
                    <View style={styles.actionsRow}>
                        <Pressable
                            style={[styles.actionButtonSmall, {
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.radii.md
                            }]}
                            onPress={() => router.push("/RideSessions")}
                        >
                            <Ionicons name="bicycle-outline" size={18} color={theme.colors.primaryForeground}/>
                            <Text style={[styles.actionButtonSmallText, {color: theme.colors.primaryForeground}]}>Ride
                                Sessions</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.actionButtonSmall, {
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.radii.md
                            }]}
                            onPress={() => router.push("/Settings")}
                        >
                            <Ionicons name="settings-outline" size={18} color={theme.colors.primaryForeground}/>
                            <Text
                                style={[styles.actionButtonSmallText, {color: theme.colors.primaryForeground}]}>Settings</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {flex: 1},
    scroll: {flex: 1},
    content: {padding: 20},
    topRow:{width: "100%", flexDirection: "row", justifyContent: "flex-end", marginBottom: 12},
    metricRow: {width:"100%", flexDirection: "row", justifyContent: "space-between", marginBottom: 18, paddingHorizontal: 30},
    connectStatus: {flexDirection: "row", alignItems: "center", gap: 6},
    connectedDot: {width: 8, height: 8, borderRadius: 4},
    connectionText: {fontSize: 12, fontWeight: "600"},
    pairText: {fontSize: 12, fontWeight: "700", marginLeft: 4},
    deviceMetric: {width:100, marginBottom: 18},
    metricHead: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    metricLabel: {flexDirection: "row", alignItems: "center", gap: 6},
    metricTitle: {fontSize: 13, fontWeight: "600"},
    metricValue: {fontsize: 15, fontweight: "800"},
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
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 20,
        marginBottom: 18,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        elevation: 5,
    },
    productImage: {width: '100%', height: 260, marginBottom: 16},
    actionsCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 14,
        marginTop: 4,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        elevation: 5,
    },
    actionsRow: {flexDirection: "row", gap: 10, marginTop: 4},
    actionButtonSmall: {
        flex: 1,
        minHeight: 82,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 3},
        elevation: 5,
    },
    actionButtonSmallText: {
        fontWeight: "700",
        fontSize: 13,
        marginTop: 6,
        textAlign: "center",
        lineHeight: 16,
    },
});