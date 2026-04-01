import React, {useState} from "react";
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

    const handleAddMockIncident = () => {
        Alert.alert("Add Mock Incident", "Just for show for now!");
    };

    const handleWipeMockData = () => {
        Alert.alert("Wipe Mock Data", "Just for show for now!");
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