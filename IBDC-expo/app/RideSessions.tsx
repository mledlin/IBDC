import React, {useMemo, useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {isIncidentComplete} from "@/domain/Incident";
import { getSessionHistoryData } from "./database";
const SESSIONS_PER_PAGE = 5;

export default function RideSession({navigation}: any) {
    const [currentPage, setCurrentPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filterHasIncidents, setfilterHasIncidents] = useState(false);
    const [filterActionRequired, setFilterActionRequired] = useState(false);
    const [allSessions, setAllSessions] = useState<any[]>([]);

    const scrollViewRef = useRef<ScrollView>(null);

    function sessionHasActionRequired(session: any): boolean {
        return session.incidents.some((incident: any) => !isIncidentComplete(incident));
    }

     useFocusEffect(
        React.useCallback(() => {
            async function loadSessions(){
                try{
                    const sessions = await getSessionHistoryData();
                    setAllSessions(sessions);
                    setCurrentPage(0);
                } catch (error) {
                    console.error("Failed to load session history", error);
                }
            }
            loadSessions();
        }, [])
    );   
    const filteredSessions = useMemo(() => {
        return allSessions.filter((session) => {
            if (!filterHasIncidents && !filterActionRequired) {
                return true;
            }

            const matchesHasIncidents =
                filterHasIncidents && session.incidents.length > 0;

            const matchesActionRequired =
                filterActionRequired && sessionHasActionRequired(session);

            return matchesHasIncidents || matchesActionRequired;
        });
    }, [allSessions, filterHasIncidents, filterActionRequired]);

    const startIndex = currentPage * SESSIONS_PER_PAGE;
    const endIndex = startIndex + SESSIONS_PER_PAGE;
    const visibleSessions = filteredSessions.slice(startIndex, endIndex);

    const hasNextPage = endIndex < filteredSessions.length;
    const hasPreviousPage = currentPage > 0;

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
        const selectedImage =
        incident.imageFiles.find(
            (image: any) => image.id === incident.selectedImageId) || null;
        
        router.push({
            pathname: "/IncidentDetail",
            params: {
                id: incident.id,
                session_id: incident.session_id,
                created_time: incident.created_time,
                latitude: incident.latitude,
                longitude: incident.longitude,
                license_plate: incident.license_plate,
                best_image_id: incident.best_image_id,
                image_path: selectedImage?.file_path ?? null,
            },
        });
    }

    function handleToggleFilters() {
        setShowFilters(!showFilters);
    }

    function handleToggleNoIncidents() {
        setCurrentPage(0);
        setfilterHasIncidents(!filterHasIncidents);
    }

    function handleToggleActionRequired() {
        setCurrentPage(0);
        setFilterActionRequired(!filterActionRequired);
    }

    function handleClearAllFilters() {
        setfilterHasIncidents(false);
        setFilterActionRequired(false);
        setShowFilters(false);
        setCurrentPage(0);
        scrollToTop();
    }

    return (
        <View style={styles.screenBackground}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}>
                <View style={styles.display}>
                    <View
                        style={[
                            styles.headerBox,
                            showFilters && styles.compactHeaderBox,
                        ]}>
                        <Text style={styles.headerText}>Ride Sessions</Text>

                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={handleToggleFilters}>
                            <Text style={styles.filterButtonText}>Filter</Text>
                        </TouchableOpacity>
                    </View>

                    {showFilters && (
                        <View style={styles.filterPanel}>
                            <View style={styles.filterButtonRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOptionButton,
                                        filterHasIncidents && styles.activeFilterOptionButton,
                                    ]}
                                    onPress={handleToggleNoIncidents}>
                                    <Text style={styles.filterOptionButtonText}>
                                        Only Show with Incidents
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.filterOptionButton,
                                        filterActionRequired &&
                                        styles.activeFilterOptionButton,
                                    ]}
                                    onPress={handleToggleActionRequired}>
                                    <Text style={styles.filterOptionButtonText}>
                                        Show Action Required
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.clearFiltersButton}
                                onPress={handleClearAllFilters}>
                                <Text style={styles.clearFiltersButtonText}>
                                    Clear All Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {visibleSessions.map((session, index) => {
                        const formattedDateTime = session.startDateStamp
                            ? session.startDateStamp.toLocaleDateString() +
                            " - " +
                            session.startDateStamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                            })
                            : "Unknown date - Unknown time";

                        return (
                            <View key={startIndex + index} style={styles.sessionCard}>
                                <Text style={styles.dateText}>{formattedDateTime}</Text>

                                {session.incidents.length === 0 ? (
                                    <View style={styles.noIncidentContainer}>
                                        <Text style={styles.noIncidentText}>
                                            No Incidents!
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={true}
                                        contentContainerStyle={styles.incidentRow}>
                                        {session.incidents.map((incident: any, incidentIndex: number) => {
                                            const selectedImage =
                                                incident.imageFiles.find(
                                                    (image: any) =>
                                                        image.id === incident.selectedImageId
                                                ) || null;

                                            return (
                                                <TouchableOpacity
                                                    key={incidentIndex}
                                                    style={styles.incidentCard}
                                                    onPress={() => handleIncidentPress(incident)}>
                                                        {selectedImage ? (
                                                            <Image
                                                                source = {selectedImage.uri}                                            
                                                                style = {styles.incidentImage}
                                                                resizeMode = "cover"
                                                                /> 
                                                        ) : (
                                                            <View style = {styles.actionRequiredBox}> 
                                                                <Text style = {styles.actionRequiredText}> 
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

    compactHeaderBox: {
        paddingVertical: 8,
    },
    filterButton: {
        position: "absolute",
        right: 10,
        bottom: 8,
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    filterButtonText: {
        color: "black",
        fontSize: 14,
        fontWeight: "bold",
    },
    filterPanel: {
        width: "95%",
        backgroundColor: "lightgrey",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    filterButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    filterOptionButton: {
        width: "48%",
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    activeFilterOptionButton: {
        backgroundColor: "blue",
    },
    filterOptionButtonText: {
        color: "black",
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
    },
    clearFiltersButton: {
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: "black",
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    clearFiltersButtonText: {
        color: "black",
        fontSize: 14,
        fontWeight: "bold",
    },
});