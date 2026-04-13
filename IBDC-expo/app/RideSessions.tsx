import React, {useMemo, useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {fullMockHistory} from "@/domain/mockData";
import {isIncidentComplete} from "@/domain/Incident";
import{ useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

const SESSIONS_PER_PAGE = 5;

export default function RideSession({navigation}: any) {
    const router = useRouter();
    const {theme} = useTheme();
    const [currentPage, setCurrentPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filterHasIncidents, setfilterHasIncidents] = useState(false);
    const [filterActionRequired, setFilterActionRequired] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    function sessionHasActionRequired(session: any): boolean {
        return session.incidents.some((incident: any) => !isIncidentComplete(incident));
    }

    const filteredSessions = useMemo(() => {
        return fullMockHistory.filter((session) => {
            if (!filterHasIncidents && !filterActionRequired) {
                return true;
            }

            const matchesHasIncidents =
                filterHasIncidents && session.incidents.length > 0;

            const matchesActionRequired =
                filterActionRequired && sessionHasActionRequired(session);

            return matchesHasIncidents || matchesActionRequired;
        });
    }, [filterHasIncidents, filterActionRequired]);

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
        // TODO //just for navigation testing for now - need to pass incident ID and load details on the other page
            router.push({
                pathname: "/IncidentDetail",
                params: { incidentId: incident.id }
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
        <View style={[styles.screenBackground, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}>
                <View style={styles.display}>
                    <View
                        style={[
                            styles.headerBox, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border },
                            showFilters && styles.compactHeaderBox,
                        ]}
                        >
                            <View>
                                <Text style={[styles.microheader,{color : theme.colors.textSecondary}]}>History</Text>
                        <Text style={[styles.headerText, {color : theme.colors.textSecondary}]}>Ride Sessions</Text>
                            </View>
                        <TouchableOpacity
                            style={[
                                styles.filterButton, 
                                { 
                                backgroundColor: showFilters
                                ? theme.colors.primary 
                                : theme.colors.background,
                                borderColor: theme.colors.border, 
                            },
                            ]}
                            onPress={handleToggleFilters}
                            >
                <Ionicons
                name="options-outline"
                size={16}
                color={
                  showFilters
                    ? theme.colors.primaryForeground
                    : theme.colors.text
                }
              />

                            <Text style={[styles.filterButtonText,
                                { color: showFilters ? theme.colors.primaryForeground : theme.colors.text },
                            ]}>Filter</Text>
                        </TouchableOpacity>
                    </View>

                    {showFilters && (
                        <View style={[styles.filterPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
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
                                        {session.incidents.map((incident, incidentIndex) => {
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
                                                    {isIncidentComplete(incident) ? (
                                                        selectedImage ? (
                                                            <Image
                                                                source={selectedImage.uri}
                                                                style={styles.incidentImage}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <View style={styles.actionRequiredBox}>
                                                                <Text style={styles.actionRequiredText}>
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
    microheader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
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