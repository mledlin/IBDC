/**
 * Settings screen for the application.
 *
 * This screen provides:
 * - Theme controls.
 * - Display settings for ride session screen.
 * - Deletion of stored data older than a selected age.
 * - Debug tools for generating mock session and incident data.
 */

import React, {useState} from "react";

import {
    getAllSessions,
    deleteAllSessions,
    deleteSessionsOlderThan,
} from "@/database/SessionDao";

import {
    sqliteMockDataPersistence,
} from "@/database/MockDataPersistence";

import {
    generateMockSessionData,
} from "@/services/MockDataService";

import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert, ScrollView,
} from "react-native";

import {useTheme} from "@/context/ThemeContext";
import {useDevice} from "@/context/DeviceContext"
import ThemePicker from "@/components/ui/ThemePicker";
import {useSafeAreaInsets} from "react-native-safe-area-context";

/**
 * Renders the settings screen and manages all local settings UI state.
 *
 * This component includes theme selection, session display controls,
 * cleanup actions for older stored data, and debug tools for adding
 * mock sessions and incidents to the local database.
 *
 * @returns The settings screen UI.
 */
export default function SettingsPage() {
    const {theme} = useTheme();
    const {deviceMode, setDeviceMode, desiredImagesPerEvent, setImagesPerEvent} = useDevice();
    const [isClearingTestData, setIsClearingTestData] = useState(false);
    const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

    const [isUpdatingImagesPerEvent, setIsUpdatingImagesPerEvent,] = useState(false);
    /**
     * Available age thresholds for bulk deleting older stored data.
     */
    const deleteOlderThanOptions = [
        "3 Months",
        "6 Months",
        "1 year",
    ];

    const [deleteOlderThanIndex, setDeleteOlderThanIndex] = useState(0);

    /**
     * Available page size options for the session history screen.
     */
    const dataOptions = [
        "10",
        "25",
        "50",
        "100",
        "All",
    ];

    const [dataIndex, setDataIndex] = useState(0);

    /**
     * Moves the session display selector to the previous option.
     */
    const handlePrevOption = () => {
        if (dataIndex > 0) {
            setDataIndex(dataIndex - 1);
        }
    };

    /**
     * Moves the session display selector to the next option.
     */
    const handleNextOption = () => {
        if (dataIndex < dataOptions.length - 1) {
            setDataIndex(dataIndex + 1);
        }
    };

    /**
     * Moves the delete-age selector to the previous option.
     */
    const handlePrevDeleteOlderThan = () => {
        if (deleteOlderThanIndex > 0) {
            setDeleteOlderThanIndex(deleteOlderThanIndex - 1);
        }
    };

    /**
     * Moves the delete-age selector to the next option.
     */
    const handleNextDeleteOlderThan = () => {
        if (deleteOlderThanIndex < deleteOlderThanOptions.length - 1) {
            setDeleteOlderThanIndex(deleteOlderThanIndex + 1);
        }
    };

    /**
     * Change the user's prefered number of images per event.
     */
    async function updateImagesPerEvent(newCount: number): Promise<void> {
        try{
            setIsUpdatingImagesPerEvent(true);
            await setImagesPerEvent(newCount);
        }catch(error){
            console.error("Settings: failed to update images per event", error);
            Alert.alert("Settings Error", error instanceof Error ? error.message : String(error));
        }finally {
            setIsUpdatingImagesPerEvent(false);
        }
    }

    /**
     * Builds the cutoff date used for deleting older data.
     *
     * The returned date is based on the currently selected delete-age option.
     *
     * @returns A Date representing the oldest time to keep.
     */
    function getCutoffDate(): Date {
        const cutoff = new Date();

        switch (deleteOlderThanOptions[deleteOlderThanIndex]) {
            case "3 months":
                cutoff.setMonth(cutoff.getMonth() - 3);
                break;
            case "6 months":
                cutoff.setMonth(cutoff.getMonth() - 6);
                break;
            case "1 year":
                cutoff.setFullYear(cutoff.getFullYear() - 1);
                break;
            default:
                cutoff.setMonth(cutoff.getMonth() - 3);
                break;
        }

        return cutoff;
    }

    /**
     * Prompts the user to confirm bulk deletion of stored data
     * older than the selected age threshold.
     *
     * If confirmed, matching sessions and related incidents are deleted.
     */
    const handleDeleteOldData = async () => {
        const selectedOption = deleteOlderThanOptions[deleteOlderThanIndex];

        Alert.alert(
            "Delete Old Data",
            `Are you sure you want to delete all sessions and incidents older than ${selectedOption}? This cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const cutoff = getCutoffDate();
                            await deleteSessionsOlderThan(cutoff.toISOString());

                            const sessions = await getAllSessions();
                            console.log("Remaining sessions:", sessions);

                            Alert.alert(
                                "Success",
                                `All data older than ${selectedOption} has been deleted.`
                            );
                        } catch (error) {
                            console.error("Failed to delete old data", error);
                            Alert.alert(
                                "Error",
                                "Could not delete old data."
                            );
                        }
                    },
                },
            ]
        );
    };

    /**
     * Creates 1 persistent randomized mock session data set.
     *
     * Generation details live outside the UI so they can be
     * reused and tested independently.
     */
    const handleAddMockIncident = async () => {
        try {
            const mockData =
                await generateMockSessionData(
                    sqliteMockDataPersistence,
                );

            const sessions =
                await getAllSessions();

            console.log(
                "Sessions:",
                sessions,
            );

            Alert.alert(
                "Success",
                `Mock session added with ${mockData.incidents.length} incidents`,
            );
        } catch (error) {
            console.error(
                "Failed to add mock data",
                error,
            );
        }
    };

    const handleClearTestRideData = () => {
        Alert.alert("Clear Test Ride Data?", 
            "This will permenetly delete every ride session, incident, and saved incident photo. App settings and paired decices will not be chnaged.", 
        [
            {
                text: "Cancel", 
                style: "cancel",
            },
            {
                text: "Clear All Data", 
                style: "destructive",
                onPress: async () => {
                    try{
                        setIsClearingTestData(true);
                        await deleteAllSessions();
                        Alert.alert("Test Data Cleared", "All ride test data has been deleted.");
                    } catch (error) {
                        console.error("Failed to clear test ride data", error);
                        Alert.alert("Error", "Could not clear the ride test data. :(");
                    } finally {
                        setIsClearingTestData(false);
                    }
                },
            },
        ]
    );
    };

    return (
        <View
            style={[styles.container, {backgroundColor: theme.colors.background, paddingTop: useSafeAreaInsets().top}]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.title, {color: theme.colors.text}]}>SETTINGS</Text>
                <Text style={[styles.sectionLabel, {color: theme.colors.text}]}>DEVICE SOURCE</Text>
                <View style={styles.retentionSection}>
                <View style={styles.settingsToggle}>
                    <Switch
                     value={deviceMode === 'real'} 
                     disabled={isSwitchingDevice}
                     onValueChange={async enabled => {
                        setIsSwitchingDevice(true);
                        try{
                            await setDeviceMode(enabled ? 'real' : 'mock');
                        }catch (error){
                            const message = 
                            error instanceof Error && error.message.includes("createClient")
                            ? "Real BLE requires a development Build. Expo Go cannot run react-native-ble-plx."
                            : error instanceof Error 
                                ? error.message
                                :String(error);
                            Alert.alert('Device switch failed', message);
                        }finally {
                            setIsSwitchingDevice(false);
                        }
                     }} 
                     thumbColor={theme.colors.primary}
                     />
                    <Text 
                    style={[styles.settingLabel, {color: theme.colors.text}]}>{deviceMode === 'real' ? 'Real IBDC device' : 'Simulated IBDC device'}</Text>
                </View>
                 <Text style={{color: theme.colors.textSecondary, marginBottom: 16}}>
                    Switching disconnects the current device. Scan again on Pair Device.
                </Text>
                </View>
                <Text style={[
                    styles.sectionLabel, 
                    {color: theme.colors.text,}]}>
                        DEVICE SETTINGS
                </Text> 

                <View style={styles.retentionSection}>
                    <Text style={[styles.retentionLabel, {color: theme.colors.text,}]}>
                        Images Per Event
                    </Text>
                    <View style = {styles.retentionSelector}>
                        <TouchableOpacity
                        onPress={()=> 
                            void updateImagesPerEvent(desiredImagesPerEvent - 1)
                            } 
                        disabled={desiredImagesPerEvent <= 1 || isUpdatingImagesPerEvent} style={styles.arrowButton}>
                            <Text style={[styles.arrowText, {color: desiredImagesPerEvent <= 1|| isUpdatingImagesPerEvent ? theme.colors.textSecondary : theme.colors.text,},]}>
                                {"\u25c0"}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.retentionValue, {color: theme.colors.text,},]}>
                            {desiredImagesPerEvent}
                        </Text>
                        <TouchableOpacity
                        onPress={()=> 
                            void updateImagesPerEvent(desiredImagesPerEvent + 1)
                        }
                        disabled={isUpdatingImagesPerEvent}
                        style={styles.arrowButton}>
                            <Text style={[styles.arrowText, {color: isUpdatingImagesPerEvent ? theme.colors.textSecondary : theme.colors.text,}]}>
                                {"\u25B6"}
                            </Text>
                        </TouchableOpacity>
                        </View>
                            <Text style={[styles.settingDescription, {color: theme.colors.textSecondary,},]}>
                                Number of photos the IBDC device captures for each incident.
                            </Text>
                        </View>  

                {/* Theme picker */}
                <Text style={[styles.sectionLabel, {color: theme.colors.text}]}>APPEARANCE</Text>
                <ThemePicker/>


                <View style={styles.retentionSection}>
                    <Text style={[styles.retentionLabel, {color: theme.colors.text}]}>Sessions Displayed Per Page</Text>

                    <View style={styles.retentionSelector}>
                        <TouchableOpacity
                            onPress={handlePrevOption}
                            style={styles.arrowButton}>
                            <Text
                                style={[
                                    styles.arrowText,
                                    dataIndex === 0 && {color: theme.colors.background}]}>
                                {"\u25C0"}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.retentionValue, {color: theme.colors.text}]}>
                            {dataOptions[dataIndex]}
                        </Text>

                        <TouchableOpacity
                            onPress={handleNextOption}
                            style={styles.arrowButton}>
                            <Text
                                style={[
                                    styles.arrowText, {color: theme.colors.text},
                                    dataIndex === dataOptions.length - 1 && {color: theme.colors.background}]}>
                                {"\u25B6"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.retentionSection}>
                    <Text style={[styles.retentionLabel, {color: theme.colors.text}]}>
                        Delete Data Older Than
                    </Text>

                    <View style={styles.retentionSelector}>
                        <TouchableOpacity
                            onPress={handlePrevDeleteOlderThan}
                            style={styles.arrowButton}>

                            <Text
                                style={[
                                    styles.arrowText,
                                    {color: theme.colors.text},
                                    deleteOlderThanIndex === 0 && {color: theme.colors.background},
                                ]}>
                                {"\u25C0"}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.retentionValue, {color: theme.colors.text}]}>
                            {deleteOlderThanOptions[deleteOlderThanIndex]}
                        </Text>

                        <TouchableOpacity
                            onPress={handleNextDeleteOlderThan}
                            style={styles.arrowButton}>

                            <Text
                                style={[
                                    styles.arrowText,
                                    {color: theme.colors.text},
                                    deleteOlderThanIndex === deleteOlderThanOptions.length - 1 &&
                                    {color: theme.colors.background},
                                ]}>
                                {"\u25B6"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.deleteOldDataButton,
                            {backgroundColor: theme.colors.danger, borderRadius: theme.radii.md},
                        ]}
                        onPress={handleDeleteOldData}>

                        <Text
                            style={[
                                styles.actionButtonText,
                                {color: theme.colors.primaryForeground},
                            ]}>
                            Delete Old Data
                        </Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.debugSection}>
                    <Text style={[styles.inBoxSectionLabel, {color: theme.colors.text}]}>DEBUG FEATURES</Text>
                    <TouchableOpacity
                        style={[
                            styles.addMockButton,
                            {
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.radii.md,
                            },
                        ]}
                        onPress={handleAddMockIncident}>

                        <Text style={[styles.actionButtonText, {color: theme.colors.primaryForeground}]}>
                            Add Random Mock Incident Data
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.wipeButton,
                            {
                                backgroundColor: theme.colors.danger,
                                borderRadius: theme.radii.md,
                                opacity: isClearingTestData ? 0.6 : 1,
                            }
                        ]}
                        onPress={handleClearTestRideData}
                        disabled={isClearingTestData}>
                            <Text style={[styles.actionButtonText, {color: theme.colors.primaryForeground}]}>
                                {isClearingTestData ? "clearing Test Data..." : "Clear Test Ride Data (DEV TOOL)"}
                            </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 24,
    },
    settingDescription: {
        marginTop: 8,
        textAlign: "center", 
        fontSize: 14, 
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1.2,
        marginBottom: 8,
        marginTop: 24,
        paddingHorizontal: 4,
    },
    inBoxSectionLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1.2,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 40,
        color: "#333333",
    },
    settingsToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    settingLabel: {
        marginLeft: 16,
        fontSize: 18,
    },
    retentionSection: {
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 8,
    },
    retentionLabel: {
        fontSize: 18,
        marginBottom: 12,
    },
    retentionSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    arrowButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    arrowText: {
        fontSize: 24,
        fontWeight: "bold",
    },
    retentionValue: {
        minWidth: 120,
        textAlign: "center",
        fontSize: 18,
    },
    deleteOldDataButton: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    addMockButton: {
        marginTop: 30,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    wipeButton: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    actionButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
    debugSection: {
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 8,
    },
});