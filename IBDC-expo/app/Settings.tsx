import React, {useState} from "react";
import {createSession, getAllSessions, deleteAllSessions, createIncident, createIncidentImage} from "./database";
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import ThemePicker from "@/components/ui/ThemePicker";

export default function SettingsPage() {
const { theme } = useTheme();

    // TODO Load from a properties file on startup!
    const [settingOne, setting1] = useState(true);
    const [settingTwo, setting2] = useState(false);
    const [settingThree, setting3] = useState(false);

    //MOCK IMAGE POOL
    const mockImages = ["example1", "example2", "example3", "example4"];

    const dataOptions = [
        "10",
        "25",
        "50",
        "100",
        "All",
    ];

    const [dataIndex, setDataIndex] = useState(0);

    const handlePrevOption = () => {
        if (dataIndex > 0) {
            setDataIndex(dataIndex - 1);
        }
    };

    const handleNextOption = () => {
        if (dataIndex < dataOptions.length - 1) {
            setDataIndex(dataIndex + 1);
        }
    };

    const handleAddMockIncident = async () => {
        try{
            const sessionId = Date.now().toString();
            await createSession(sessionId);

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
                { make: "Toyota", model: "Camry", color: "Blue", year: "2020"},
                {make: "Honda", model: "Civic", color: "Black", year: "2018"},
                {make: "Ford", model: "F-150", color: "White", year: "2022"},
                {make: "Chevrolet", model: "Malibu", color: "Silver", year: "2019"},
                {make: "Nissan", model: "Altima", color: "Red", year: "2021"},
            ];
            const coordinates = [
                {lat: 33.4484, long: -122.0740},
                {lat: 33.4501, long: -112.183},
                {lat: 32.3123, long: -110.232},
                {lat: 31.3211, long: -113.111},
            ];
            function pickRandom<T>(items: T[]): T{
                return items[Math.floor(Math.random() * items.length)];
            }
            const incidentCount = Math.floor(Math.random() * 5);

            for (let i = 0; i < incidentCount; i++){
                //Tester method for generating data without thumbnail
                const hasThumbnail = Math.random() < 0.7;
                const vehicle = pickRandom(vehicles);
                const coord = pickRandom(coordinates);
                const incidentId = `${sessionId}-incident-${i+1}`;
                //Conditional logic is solely for generating variance in mock data
                const imageKey = hasThumbnail ? pickRandom(mockImages) : null;
                const imageId = hasThumbnail ? `${incidentId}-${imageKey}` : null;
            
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
                    Math.random() < 0.5 ? 0:1,
                    pickRandom(driverInfos),
                    pickRandom(comments),
                    vehicle.make,
                    vehicle.model,
                    vehicle.color,
                    vehicle.year,
                    new Date(Date.now() + i * 1000).toISOString()
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

    const handleWipeMockData = async () => {
        try{
            await deleteAllSessions();
            const sessions = await getAllSessions();
            console.log("Sessions: ", sessions);
            Alert.alert("Success", "Session data has been wiped");
        } catch (error) {
            console.error("Failed to wipe sessions", error);
            Alert.alert("Error", "Could not wipe")
        }
    };

    return (   
         <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            <Text style={[styles.title, { color: theme.colors.text }]}>SETTINGS</Text>


            <View style={styles.settingsToggle}>
                <Switch value={settingOne} onValueChange={setting1} thumbColor={theme.colors.primary}/>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Unknown Setting 1</Text>
            </View>

            <View style={styles.settingsToggle}>
                <Switch value={settingTwo} onValueChange={setting2} thumbColor={theme.colors.primary}/>
                <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Unknown Setting 2</Text>
            </View>

            <View style={styles.settingsToggle}>
                 <Switch value={settingThree} onValueChange={setting3} thumbColor={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Unknown Setting 3</Text>
            </View>
             {/* Theme picker */}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>APPEARANCE</Text>

            <ThemePicker />


            <TouchableOpacity
                style={[styles.addMockButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md }]}
                onPress={handleAddMockIncident}
            >
                <Text style={[styles.actionButtonText, { color: theme.colors.primaryForeground }]}>
                    Add Random Mock Incident Data
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.wipeButton, { backgroundColor: theme.colors.danger, borderRadius: theme.radii.md }]}
                onPress={handleWipeMockData}
            >
                <Text style={[styles.actionButtonText, { color: theme.colors.primaryForeground }]}>
                    Wipe All Mock Data
                </Text>
            </TouchableOpacity>
            <View style={styles.retentionSection}>
                <Text style={[styles.retentionLabel, { color: theme.colors.text }]}>Sessions Per Page</Text>

                <View style={styles.retentionSelector}>
                    <TouchableOpacity
                        onPress={handlePrevOption}
                        style={styles.arrowButton}>
                        <Text
                            style={[
                                styles.arrowText,
                                dataIndex === 0 && { color: theme.colors.background },
                            ]}>
                            {"\u25C0"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={[styles.retentionValue, { color: theme.colors.text }]}>
                        {dataOptions[dataIndex]}
                    </Text>

                    <TouchableOpacity
                        onPress={handleNextOption}
                        style={styles.arrowButton}>
                        <Text
                            style={[
                                styles.arrowText, {color: theme.colors.text},
                                dataIndex === dataOptions.length - 1 && { color: theme.colors.background },
                            ]}>
                            {"\u25B6"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>  
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1.2,
        marginBottom: 8,
        marginTop: 24,
        paddingHorizontal: 4,},
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
        marginBottom: 24,
    },
    settingLabel: {
        marginLeft: 16,
        fontSize: 18,
    },
    retentionSection: {
        marginTop: 8,
        marginBottom: 24,
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
    addMockButton: {
        marginTop: 30,
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
});