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

export default function SettingsPage() {
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
                "Driver stopped",
                "Driver left scene",
                "Driver apologized",
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
            const incidentCount = Math.floor(Math.random() * 4) + 1;

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
        <View style={styles.container}>
            <Text style={styles.title}>SETTINGS</Text>

            <View style={styles.settingsToggle}>
                <Switch value={settingOne} onValueChange={setting1}/>
                <Text style={styles.settingLabel}>Unknown Setting 1</Text>
            </View>

            <View style={styles.settingsToggle}>
                <Switch value={settingTwo} onValueChange={setting2}/>
                <Text style={styles.settingLabel}>Unknown Setting 2</Text>
            </View>

            <View style={styles.settingsToggle}>
                <Switch value={settingThree} onValueChange={setting3}/>
                <Text style={styles.settingLabel}>Unknown Setting 3</Text>
            </View>

            <View style={styles.retentionSection}>
                <Text style={styles.retentionLabel}>Sessions Per Page</Text>

                <View style={styles.retentionSelector}>
                    <TouchableOpacity
                        onPress={handlePrevOption}
                        style={styles.arrowButton}>
                        <Text
                            style={[
                                styles.arrowText,
                                dataIndex === 0 && styles.disabledArrowText,
                            ]}>
                            {"\u25C0"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.retentionValue}>
                        {dataOptions[dataIndex]}
                    </Text>

                    <TouchableOpacity
                        onPress={handleNextOption}
                        style={styles.arrowButton}>
                        <Text
                            style={[
                                styles.arrowText,
                                dataIndex === dataOptions.length - 1 && styles.disabledArrowText,
                            ]}>
                            {"\u25B6"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.addMockButton} onPress={handleAddMockIncident}>
                <Text style={styles.actionButtonText}>Add Random Mock Incident Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.wipeButton} onPress={handleWipeMockData}>
                <Text style={styles.actionButtonText}>Wipe All Mock Data</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f4",
        paddingTop: 60,
        paddingHorizontal: 24,
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
        marginBottom: 24,
    },
    settingLabel: {
        marginLeft: 16,
        fontSize: 18,
        color: "#333333",
    },
    retentionSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    retentionLabel: {
        fontSize: 18,
        color: "#333333",
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
        color: "#333333",
    },
    disabledArrowText: {
        color: "#aaaaaa",
    },
    retentionValue: {
        minWidth: 120,
        textAlign: "center",
        fontSize: 18,
        color: "#333333",
    },
    addMockButton: {
        marginTop: 30,
        backgroundColor: "#cf6329",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    wipeButton: {
        marginTop: 16,
        backgroundColor: "#cf6329",
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