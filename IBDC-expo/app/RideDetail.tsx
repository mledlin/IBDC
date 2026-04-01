import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView, Alert,
} from "react-native";
import {useRouter} from "expo-router";

// Used only for demo purposes.
import {defaultSession} from "@/domain/mockData"


export default function SessionDetailsScreen() {
    const router = useRouter();

    //TODO Remove and pass in session as argument when opening this screen!
    const sessionData = defaultSession;

    // I wish Java had this!
    function formatDateOnly(timestamp: Date | null): string {
        if (!timestamp) {
            return "No Date";
        }

        return timestamp.toLocaleDateString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function formatTimeOnly(timestamp: Date | null): string {
        if (!timestamp) {
            return "No Time";
        }

        return timestamp.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function formatIncidentTime(timestamp: Date | null): string {
        if (!timestamp) {
            return "No Time";
        }

        return timestamp.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function openIncident(index: number) {
        Alert.alert("Open incident page placeholder", "Attempting to load incident index: " + index + ".");
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Ride Session</Text>

            <View style={styles.detailsBox}>
                <Text style={styles.detailsLabel}>Date</Text>
                <Text style={styles.detailsValue}>
                    {formatDateOnly(sessionData.startDateStamp)}
                </Text>

                <Text style={styles.detailsLabel}>Start Time</Text>
                <Text style={styles.detailsValue}>
                    {formatTimeOnly(sessionData.startDateStamp)}
                </Text>

                <Text style={styles.detailsLabel}>Number of Incidents</Text>
                <Text style={styles.detailsValue}>{sessionData.incidents.length}</Text>
            </View>


            <Text style={styles.sectionTitle}>Incident List</Text>


            <View style={styles.incidentsBox}>
                {sessionData.incidents.length === 0 ? (<Text style={styles.noIncidents}>No incidents</Text>) : (
                    sessionData.incidents.map((incident, index) => (

                        <TouchableOpacity
                            key={index}
                            style={styles.incidentRow}
                            onPress={() => openIncident(index)}>

                            <Text style={styles.incidentText}>
                                Incident {index + 1} - {formatIncidentTime(incident.gpsTimestamp)}
                            </Text>
                        </TouchableOpacity>

                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },

    detailsBox: {
        borderWidth: 2,
        borderColor: "#000000",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },

    detailsLabel: {
        fontSize: 14,
        color: "#000000",
        marginTop: 8,
    },

    detailsValue: {
        fontSize: 18,
        color: "#000000",
        marginTop: 2,
    },

    sectionTitle: {
        fontSize: 20,
        marginBottom: 12,
    },

    incidentsBox: {
        borderWidth: 1,
        borderColor: "#000000",
        borderRadius: 8,
        marginBottom: 24,
    },

    incidentRow: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
    },

    incidentText: {
        fontSize: 16,
        color: "#000000",
    },

    noIncidents: {
        padding: 14,
        fontSize: 16,
        color: "#000000",
    },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: "black",
  },
  rideContainer:{
    marginHorizontal: 24,
    backgroundColor: "#fff", 
    borderRadius: 16,
    padding: 20, 
    marginBottom: 28, 
    shadowColor: "#000", 
    shadowOffset: {width: 0, height: 2}, 
    shadowOpacity: 0.07, 
    shadowRadius: 8, 
    elevation: 3,
  },
  map:{
        width:"100%",
        height:"100%",
  }
});
