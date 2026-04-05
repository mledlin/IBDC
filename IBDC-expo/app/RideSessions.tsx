import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import {fullMockHistory} from "@/domain/mockData";

const sessionData = fullMockHistory;

export default function RideSessionsScreen() {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.screen}>

                    <View style={styles.headerBox}>
                        <Text style={styles.headerText}>Ride Sessions</Text>
                    </View>

                    {sessionData.map((session, index) => {
                        const hasIncidents = session.incidents.length > 0;

                        const formattedDateTime = session.startDateStamp
                            ? session.startDateStamp.toLocaleDateString() +
                            " - " +
                            session.startDateStamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                            })
                            : "Unknown date - Unknown time";

                        return (
                            <View key={index} style={styles.sessionCard}>
                                <Text style={styles.dateText}>{formattedDateTime}</Text>

                                {hasIncidents ? (
                                    <TouchableOpacity style={styles.incidentButton}>
                                        <Text style={styles.incidentText}>
                                            {session.incidents.length > 1
                                                ? "ACTION\nREQUIRED"
                                                : "Incident"}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.noIncidentContainer}>
                                        <Text style={styles.noIncidentText}>
                                            No Incidents!
                                        </Text>
                                    </View>
                                )}


                            </View>

                        );
                    })}

                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    scrollContainer: {
        paddingVertical: 10,
        alignItems: "center",
    },
    screen: {
        width: "100%",
        alignItems: "center",
    },
    headerBox: {
        width: "95%",
        backgroundColor: "blue",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 18,
        paddingVertical: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    headerText: {
        color: "white",
        fontSize: 22,
        fontWeight: "500",
    },
    sessionCard: {
        width: "82%",
        backgroundColor: "grey",
        borderWidth: 2,
        borderColor: "black",
        minHeight: 190,
        marginBottom: 12,
        paddingTop: 10,
        alignItems: "center",
    },
    dateText: {
        fontSize: 16,
        color: "black",
        marginBottom: 12,
    },
    incidentButton: {
        marginTop: 6,
        width: 210,
        height: 120,
        backgroundColor: "blue",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    incidentText: {
        fontSize: 24,
        color: "white",
        textAlign: "center",
        fontWeight: "400",
        lineHeight: 34,
    },
    noIncidentContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 30,
    },
    noIncidentText: {
        color: "black",
        fontSize: 24,
        fontWeight: "400",
    },
});