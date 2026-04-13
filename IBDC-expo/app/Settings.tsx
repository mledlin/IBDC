import React, {useState} from "react";
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

    const handleAddMockIncident = () => {
        Alert.alert("Add Mock Incident", "Just for show for now!");
    };

    const handleWipeMockData = () => {
        Alert.alert("Wipe Mock Data", "Just for show for now!");
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