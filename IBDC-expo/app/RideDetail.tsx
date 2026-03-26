import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView, Alert,
} from "react-native";
import {useRouter} from "expo-router";

// Temp pasted here from incident.ts on branch US#79-Define_Domain_Data
export type Incident = {
    imageFiles: IncidentImage[];
    selectedImageId: String | null;
    gpsLocation: GpsCoordinates | null;
    gpsTimestamp: Date | null;
    licensePlate: string;
    riderNotes: string;
//  session: Session;
};

// This type/struct will hold GPS longitude/latitude
export type GpsCoordinates = {
    latitude: number;
    longitude: number;
};

// The incident will have an array of these.
export type IncidentImage = {
    id: string;
    fileName: string;
    uri: string;
};

// Using array here until it can retrieve this data from a database.
const incidents: Incident[] = [
    {
        imageFiles: [],
        selectedImageId: null,
        gpsLocation: {
            latitude: 111.111,
            longitude: -111.111,
        },
        gpsTimestamp: new Date("2026-03-24T08:00:00"),
        licensePlate: "111111",
        riderNotes: "No bike lane. Guy passed without moving over.",
    },
    {
        imageFiles: [],
        selectedImageId: null,
        gpsLocation: null,
        gpsTimestamp: new Date("2026-03-24T08:45:12"),
        licensePlate: "222222",
        riderNotes: "Road rage. This guy almost hit me last week to!",
    },
    {
        imageFiles: [],
        selectedImageId: null,
        gpsLocation: null,
        gpsTimestamp: new Date("2026-03-24T17:00:00"),
        licensePlate: "ABCDEF",
        riderNotes: "Stopped in bike lane.",
    },
];

// TODO swap this with a real session when created.
const mockSession = {
    date: "Monday, March 24",
    startTime: "8:00 AM",
    incidents,
};

// This will need to take in a session id so it knows what to show. For now, it shows only static mock data.
export default function SessionDetailsScreen() {
    const router = useRouter();

    // I wish Java had this!
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
                <Text style={styles.detailsValue}>{mockSession.date}</Text>

                <Text style={styles.detailsLabel}>Start Time</Text>
                <Text style={styles.detailsValue}>{mockSession.startTime}</Text>

                <Text style={styles.detailsLabel}>Number of Incidents</Text>
                <Text style={styles.detailsValue}>{mockSession.incidents.length}</Text>
            </View>


            <Text style={styles.sectionTitle}>Incident List</Text>


            <View style={styles.incidentsBox}>
                {mockSession.incidents.length === 0 ? (<Text style={styles.noIncidents}>No incidents</Text>) : (
                    mockSession.incidents.map((incident, index) => (

                        <TouchableOpacity
                            key={index}
                            style={styles.incidentRow}
                            onPress={() => openIncident(index)}>

                            <Text style={styles.incidentText}>
                                Incident {index} - {formatIncidentTime(incident.gpsTimestamp)}
                            </Text>
                        </TouchableOpacity>

                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#ffffff",
        flexGrow: 1,
        paddingBottom: 32,
    },

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
});