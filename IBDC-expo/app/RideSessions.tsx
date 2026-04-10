import React, {useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";

import {fullMockHistory} from "@/domain/mockData";
import {isIncidentComplete} from "@/domain/Incident";

// This should be loaded from saved settings but for now its just a const.
const SESSIONS_PER_PAGE = 5;

export default function RideSession() {
    const [currentPage, setCurrentPage] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Determine what to show
    const startIndex = currentPage * SESSIONS_PER_PAGE;
    const endIndex = startIndex + SESSIONS_PER_PAGE;
    const visibleSessions = fullMockHistory.slice(startIndex, endIndex);

    // guardrails
    const hasNextPage = endIndex < fullMockHistory.length;
    const hasPreviousPage = currentPage > 0;

    // auto scroll to top on page load!
    function scrollToTop() {
        scrollViewRef.current?.scrollTo({y: 0, animated: true});
    }

    function handleNextPage() {
        if (hasNextPage) {
            setCurrentPage(currentPage + 1);
            scrollToTop();
        }
    }

    function handlePreviousPage() {
        if (hasPreviousPage) {
            setCurrentPage(currentPage - 1);
            scrollToTop();
        }
    }

    function handleIncidentPress(incident: any) {
        // TODO
    }

    return (
        <View style={styles.screenBackground}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}>
                <View style={styles.display}>
                    <View style={styles.headerBox}>
                        <Text style={styles.headerText}>Ride Sessions</Text>
                    </View>

                    {visibleSessions.map((session, index) => {
                        const formattedDateTime = session.startDateStamp
                            ? session.startDateStamp.toLocaleDateString() +
                            " - " +
                            session.startDateStamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                            }) : "Unknown date - Unknown time";

                        return (
                            <View key={startIndex + index} style={styles.sessionCard}>
                                <Text style={styles.dateText}>{formattedDateTime}</Text>

                                {session.incidents.length === 0 ?
                                    (
                                        <View style={styles.noIncidentContainer}>
                                            <Text style={styles.noIncidentText}>
                                                No Incidents!
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView horizontal
                                                    contentContainerStyle={styles.incidentRow}>
                                            {session.incidents.map((incident, incidentIndex) => {

                                                const selectedImage =
                                                    incident.imageFiles.find((image: any) =>
                                                        image.id === incident.selectedImageId
                                                    ) || null;

                                                return (
                                                    <TouchableOpacity
                                                        key={incidentIndex}
                                                        style={styles.incidentCard}
                                                        onPress={() => handleIncidentPress(incident)}>

                                                        {isIncidentComplete(incident) ?
                                                            (
                                                                selectedImage ? (
                                                                    <Image
                                                                        source={selectedImage.uri}
                                                                        style={styles.incidentImage}
                                                                        resizeMode="cover"
                                                                    />
                                                                ) : (
                                                                    <View style={styles.incidentCard}>
                                                                        <Text style={styles.incidentCard}>
                                                                            No Image
                                                                        </Text>
                                                                    </View>
                                                                )
                                                            ) : (
                                                                <View style={styles.actionRequiredBox}>
                                                                    <Text style={styles.actionRequiredText}>
                                                                        Action Required
                                                                    </Text>
                                                                </View>
                                                            )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                            </View>
                        );
                    })}

                    <View style={styles.pageChangeContainer}>
                        {hasPreviousPage && (
                            <TouchableOpacity
                                style={styles.pageButton}
                                onPress={handlePreviousPage}>
                                <Text style={styles.pageButtonText}>
                                    Go Back
                                </Text>
                            </TouchableOpacity>
                        )}

                        {hasNextPage && (
                            <TouchableOpacity
                                style={styles.pageButton}
                                onPress={handleNextPage}>
                                <Text style={styles.pageButtonText}>
                                    Load Next Page
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screenBackground: {
        flex: 1,
        backgroundColor: "white",
    },
    scrollContainer: {
        paddingVertical: 10,
        alignItems: "center",
    },
    display: {
        width: "100%",
        alignItems: "center",
    },
    headerBox: {
        width: "95%",
        backgroundColor: "blue",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },
    headerText: {
        color: "white",
        fontSize: 28,
    },
    sessionCard: {
        width: "80%",
        backgroundColor: "lightgrey",
        borderWidth: 2,
        borderColor: "black",
        minHeight: 220,
        marginBottom: 10,
        paddingTop: 10,
        paddingBottom: 10,
        alignItems: "center",
    },
    dateText: {
        fontSize: 16,
        color: "black",
        marginBottom: 10,
        fontWeight: "bold",
    },
    noIncidentContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 20,
    },
    noIncidentText: {
        color: "black",
        fontSize: 24,
        fontWeight: "400",
    },
    incidentRow: {
        paddingHorizontal: 10,
        alignItems: "center",
    },
    incidentCard: {
        width: 160,
        height: 150,
        marginHorizontal: 8,
        borderWidth: 2,
        borderColor: "black",
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
    },
    incidentImage: {
        width: "95%",
        height: "95%",
    },
    actionRequiredBox: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        backgroundColor: "black",
    },
    actionRequiredText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    pageChangeContainer: {
        width: "80%",
        marginTop: 8,
        marginBottom: 20,
        alignItems: "center",
    },
    pageButton: {
        width: "100%",
        backgroundColor: "blue",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginBottom: 10,
    },
    pageButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "500",
    },
});