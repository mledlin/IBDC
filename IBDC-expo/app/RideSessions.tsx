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
import{ useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext"
import  {useFocusEffect } from "expo-router";
import {isIncidentComplete} from "@/domain/Incident";
import { getSessionHistoryData } from "./database";
const SESSIONS_PER_PAGE = 5;

export default function RideSession() {
    const router = useRouter();
    const {theme} = useTheme();
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
                                <Text style={[styles.microheader,{color : theme.colors.primaryForeground}]}>History</Text>
                        <Text style={[styles.headerText, {color : theme.colors.primaryForeground}]}>Ride Sessions</Text>
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
                            <View style={styles.filterRowChip}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                            { backgroundColor: filterHasIncidents ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border },
                                    ]}
                                    onPress={handleToggleNoIncidents}>
                                    <Text style={[styles.filterChipText, { color: filterHasIncidents ? theme.colors.primaryForeground : theme.colors.text },]}>
                                        Has Incidents
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        { backgroundColor: filterActionRequired ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border },
                                    ]}
                                    onPress={handleToggleActionRequired}>
                                    <Text style={[styles.filterChipText, { color: filterActionRequired ? theme.colors.primaryForeground : theme.colors.text },]}>
                                        Action Required
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.clearFiltersButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border },]}
                                onPress={handleClearAllFilters}>
                                <Text style={[styles.clearFiltersButtonText, { color: theme.colors.text }]}>
                                    Clear All
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

                            const incidentCount = session.incidents.length;
                            const actionRequired = sessionHasActionRequired(session);

                        return (
                            <View key={startIndex + index} style={[styles.sessionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },]}>
                                <View style={styles.sessionHeader}>
                                    <View style={{flex: 1}}>
                                        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{formattedDateTime}</Text>
                                        <Text style={[styles.sessionMeta, { color: theme.colors.textSecondary }]}>{incidentCount} Incident{incidentCount !== 1 ? "s" : ""}</Text>
                                    </View>
                                    {actionRequired && (
                                        <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary}]}>
                                            <Text style={[styles.statusBadgeText, { color: theme.colors.primaryForeground },]}>Needs Review</Text>
                                        </View>
                                    )}
                                </View>
                                {session.incidents.length === 0 ? (
                                    <View style={[styles.noIncidentContainer, { backgroundColor: theme.colors.background },]}>
                                        <Ionicons name="checkmark-circle-outline" size={28} color={theme.colors.primary} />
                                        <Text style={[styles.noIncidentText, { color: theme.colors.text }]}>
                                            No incidents recorded!
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
                                                const complete = isIncidentComplete(incident);

                                            return (
                                                <TouchableOpacity
                                                    key={incidentIndex}
                                                    style={[styles.incidentCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border },]}
                                                    onPress={() => handleIncidentPress(incident)}>
                                                        {complete ? (
                                                            selectedImage ? (
                                                            <Image
                                                                source = {selectedImage.uri}                                            
                                                                style = {styles.incidentImage}
                                                                resizeMode = "cover"
                                                                /> 
                                                        ) : (
                                                            <View style={[styles.placeholderBox, { backgroundColor: theme.colors.surface },]}>
                                                                <Ionicons name="image-outline" size={26} color={theme.colors.textSecondary} />
                                                                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                                                                    No Image
                                                                </Text>
                                                            </View>
                                                        )
                                                    ) : (
                                                        <View style={[styles.actionRequiredBox, { backgroundColor: theme.colors.primary },]}>
                                                            <Ionicons name="alert-circle-outline" size={26} color={theme.colors.primaryForeground} />
                                                            <Text style={[styles.actionRequiredText, { color: theme.colors.primaryForeground }]}>
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
                                style={[styles.pageButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border },]}
                                onPress={handlePreviousPage}>
                                <Text style={[styles.pageButtonText, { color: theme.colors.primaryForeground }]}>
                                    Previous
                                </Text>
                            </TouchableOpacity>
                        )}

                        {hasNextPage && (
                            <TouchableOpacity
                                style={[styles.pageButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border },]}
                                onPress={handleNextPage}>
                                <Text style={[styles.pageButtonText, { color: theme.colors.primaryForeground}]}>
                                   Next Page
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
    },
    scrollContainer: {
        paddingVertical: 16,
        paddingHorizontal: 14,
    },
    display: {
        width: "100%",
    },
    microheader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },

    headerBox: {
        borderWidth: 1,
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    headerText: {
        fontWeight: "800",
        fontSize: 30,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    sessionCard: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    sessionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    dateText: {
        fontSize: 17,
        marginBottom: 4,
        fontWeight: "800",
    },
    sessionMeta: {
        fontSize: 13,
        fontWeight: "500",
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 10,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    noIncidentContainer: {
        borderRadius: 18,
        minHeight: 120,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 20,
    },
    noIncidentText: {
        fontSize: 16,
        fontWeight: "600",
    },
    incidentRow: {
        paddingRight: 8,
    },
    incidentCard: {
        width: 170,
        height: 160,
        marginRight: 12,
        borderWidth: 1,
        borderRadius: 18,
       overflow: "hidden",
    },
    incidentImage: {
        width: "100%",
        height: "100%",
    },
    actionRequiredBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 8,
    },
    actionRequiredText: {
        fontSize: 15,
        fontWeight: "800",
        textAlign: "center",
    },
    pageChangeContainer: {
        gap: 10,
        flexDirection: "row",
        marginTop: 4,
        marginBottom: 20,
    },
    placeholderBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: "600",
    },
    pageButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
    },
    pageButtonText: {
        fontSize: 15,
        fontWeight: "800",
    },

    compactHeaderBox: {
        paddingVertical: 8,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    filterPanel: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
    },
    filterRowChip: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    filterChip: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 12,
        alignItems: "center", 
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
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
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    clearFiltersButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
});