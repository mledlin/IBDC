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
    createSession,
    getAllSessions,
    deleteSessionsOlderThan,
} from "@/database/SessionDao";

import { createIncidentImage } from "@/database/ImageDao"
import { createIncident } from "@/database/IncidentDao"
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert, ScrollView,
} from "react-native";

import {useTheme} from "@/context/ThemeContext";
import ThemePicker from "@/components/ui/ThemePicker";

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

    // TODO Load from a properties file on startup!
    const [locationServices, setLocationServices] = useState(false);
    const [bluetoothServices, setBluetoothServices] = useState(false);
    const [uploadPhotosToLibrary, setUploadPhotosToLibrary] = useState(false);

    /**
     * Available mock image identifiers used when creating test incidents.
     */
    const mockImages = ["example1", "example2", "example3", "example4"];

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
     * Creates one mock session with a random date up to two years old, then creates a random number of
     * incidents within one hour of that session start time. Each mock incident is populated with random
     * vehicle, location, injury severity, and image data for testing the app UI and database.
     */
    const handleAddMockIncident = async () => {
        try {
            const now = Date.now();
            const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;

            function randomInt(min: number, max: number): number {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            const sessionStartTime = new Date(
                now - randomInt(0, twoYears)
            );

            const sessionId = sessionStartTime.toISOString();

            await createSession(sessionId, sessionStartTime.toISOString());

            const plates = ["ABC1234", "XYZ32", "DSA123", "1231AS", "ASU3232"];
            const severities = ["minor", "moderate", "major"];
            const driverInfos = [
                "Unknown",
                "John 423-323-1232",
                "Albert D1234912922",
                "Walter, 308 Negra Arroyo Lane, 505-965-1672",
                "No driver interaction",
            ];
            const comments = [
                "Vehicle passed too closely",
                "Driver swerved near cyclist",
                "Unsafe overtake",
                "Vehicle stayed in lane too long",
                "Close call at intersection",
            ];
            const vehicles = [
                {make: "Toyota", model: "Camry", color: "Blue", year: "2020"},
                {make: "Honda", model: "Civic", color: "Black", year: "2018"},
                {make: "Ford", model: "F-150", color: "White", year: "2022"},
                {make: "Chevrolet", model: "Malibu", color: "Silver", year: "2019"},
                {make: "Nissan", model: "Altima", color: "Red", year: "2021"},
            ];
            const coordinates = [
                { lat: 32.2226, long: -110.9747 }, // Tucson
                { lat: 32.2217, long: -110.9265 }, // Tucson
                { lat: 32.1789, long: -110.9715 }, // Tucson
                { lat: 33.4484, long: -112.0740 }, // Phoenix
                { lat: 33.4522, long: -112.0738 }, // Phoenix
                { lat: 33.4651, long: -112.0476 }, // Phoenix
            ];

            function pickRandom<T>(items: T[]): T {
                return items[Math.floor(Math.random() * items.length)];
            }

            const incidentCount = Math.floor(Math.random() * 5);

            for (let i = 0; i < incidentCount; i++) {

                //Tester method for generating data without thumbnail
                const hasThumbnail = Math.random() < 0.7;
                const vehicle = pickRandom(vehicles);
                const coord = pickRandom(coordinates);
                const incidentId = `${sessionId}-incident-${i + 1}`;

                //Conditional logic is solely for generating variance in mock data
                const imageKey = hasThumbnail ? pickRandom(mockImages) : null;
                const imageId = hasThumbnail ? `${incidentId}-${imageKey}` : null;

                const incidentTime = new Date(
                    sessionStartTime.getTime() + randomInt(0, 60 * 60 * 1000)
                );

                await createIncident(
                    incidentId,
                    sessionId,
                    coord.lat,
                    coord.long,
                    pickRandom(plates),
                    /*  mock version
                    imageId,
                    */
                    imageId,
                    pickRandom(severities),
                    Math.random() < 0.5 ? 0 : 1,
                    pickRandom(driverInfos),
                    pickRandom(comments),
                    vehicle.make,
                    vehicle.model,
                    vehicle.color,
                    vehicle.year,
                    incidentTime.toISOString()
                );
                // More mock data 
                await createIncidentImage(`${incidentId}-example1`, incidentId, "example1", null, "mock");
                await createIncidentImage(`${incidentId}-example2`, incidentId, "example2", null, "mock");
                await createIncidentImage(`${incidentId}-example3`, incidentId, "example3", null, "mock");
                await createIncidentImage(`${incidentId}-example4`, incidentId, "example4", null, "mock");

            }
            const sessions = await getAllSessions();
            console.log("Sessions:", sessions);

            Alert.alert("Success", `Mock session added with ${incidentCount} incidents`)
        } catch (error) {
            console.error("Failed to add mock data", error);
            Alert.alert("Error", "Could not add mock data");
        }


    };

    return (
        <View style={[styles.container, {backgroundColor: theme.colors.background, paddingVertical: 100}]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.title, {color: theme.colors.text}]}>CONNECTION SETTINGS</Text>

                <View style={styles.settingsToggle}>
                    <Switch value={locationServices} onValueChange={setLocationServices} thumbColor={theme.colors.primary}/>
                    <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Enable Location Services</Text>
                </View>

                <View style={styles.settingsToggle}>
                    <Switch value={bluetoothServices} onValueChange={setBluetoothServices} thumbColor={theme.colors.primary}/>
                    <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Enable Bluetooth Services</Text>
                </View>

                <View style={styles.settingsToggle}>
                    <Switch value={uploadPhotosToLibrary} onValueChange={setUploadPhotosToLibrary} thumbColor={theme.colors.primary}/>
                    <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Enable Photo Upload</Text>
                </View>

                {/* Theme picker */}
                <Text style={[styles.sectionLabel, {color: theme.colors.text}]}>APPEARANCE</Text>
                <Text style={[styles.title, {color: theme.colors.text}]}>APP THEME</Text>
                <ThemePicker/>

                <Text style={[styles.title, {color: theme.colors.text, paddingTop: 50}]}>INCIDENT PAGE </Text>

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
        paddingTop: 15
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