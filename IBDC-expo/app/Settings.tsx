import React, {useState} from "react";
import {createSession, getAllSessions, deleteAllSessions} from "./database";
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
        const id = Date.now().toString();
        await createSession(id);

        const sessions = await getAllSessions();
        console.log("Sessions:", sessions);
        
        Alert.alert("Success", `Sessions added. \nTotal Sessions: ${sessions.length}`)
        } catch (error){
            console.error("Failed to add session", error);
            Alert.alert("Error", "Could not add session")
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
            Alert.alert("Error", "Could not wipe data");
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