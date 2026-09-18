/**
 * Incident detail screen.
 *
 * Displays and edits incident information, including the selected incident image,
 * severity, vehicle details, driver information, notes, and incident deletion.
 * When no image has been selected, a placeholder is shown until the user chooses
 * and saves one.
 */
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Switch,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {
    deleteIncident,
    getIncidentById,
    updateIncidentDetails,
} from "@/database/IncidentDao";
import {
    getIncidentImagesByIncidentId,
    getMockImageSource,
} from "@/database/ImageDao";

/**
 * Available injury severity values shown in the severity selector.
 */
const SEVERITY_OPTIONS = ["None", "Minor", "Moderate", "Severe"];

/**
 * Renders the incident detail screen and keeps the UI synchronized with
 * the incident data stored in the local database.
 */
export default function IncidentDetail() {
    const router = useRouter();
    const { theme } = useTheme();

    const {
        id,
        latitude,
        longitude,
        license_plate,
        created_time,
    } = useLocalSearchParams();

    // Editable incident fields loaded from and synced to the database.
    const [injurySeverity, setInjurySeverity] = useState("None");
    const [driverPresent, setDriverPresent] = useState(false);
    const [driverInfo, setDriverInfo] = useState("");
    const [extraComments, setExtraComments] = useState("");
    const [vehicleMake, setVehicleMake] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [vehicleYear, setVehicleYear] = useState("");

    // Initialize the license plate from params until database data loads.
    const [licensePlateInput, setLicensePlateInput] = useState(
        typeof license_plate === "string" ? license_plate : ""
    );

    // Null means the placeholder should be displayed.
    const [thumbnailSource, setThumbnailSource] = useState<any>(null);

    /**
     * Deletes the current incident and returns to the previous screen.
     */
    async function handleDeleteIncident() {
        try {
            if (typeof id !== "string") {
                return;
            }

            await deleteIncident(id);
            router.back();
        } catch (error) {
            console.error("Failed to delete incident", error);
        }
    }

    /**
     * Persists one or more incident field changes.
     *
     * This helper allows each input to save immediately without requiring
     * a separate save button.
     */
    async function saveIncidentField(updates: {
        license_plate?: string | null;
        injury_severity?: string | null;
        driver_present?: number;
        driver_information?: string | null;
        extra_comment?: string | null;
        vehicle_make?: string | null;
        vehicle_model?: string | null;
        vehicle_color?: string | null;
        vehicle_year?: string | null;
    }) {
        try {
            if (typeof id !== "string") {
                return;
            }

            await updateIncidentDetails(id, updates);
        } catch (error) {
            console.error("Failed to update incident", error);
        }
    }

    /**
     * Reloads incident details whenever this screen regains focus.
     *
     * This is important after returning from ChoosePhoto because the selected
     * image may have changed while screen was not active.
     */
    useFocusEffect(
        React.useCallback(() => {
            async function loadIncidentData() {
                try {
                    if (typeof id !== "string") {
                        return;
                    }

                    const incident: any = await getIncidentById(id);
                    const images: any[] =
                        await getIncidentImagesByIncidentId(id);

                    setLicensePlateInput(incident?.license_plate ?? "");
                    setInjurySeverity(incident?.injury_severity ?? "None");
                    setDriverPresent(Boolean(incident?.driver_present));
                    setDriverInfo(incident?.driver_information ?? "");
                    setExtraComments(incident?.extra_comment ?? "");
                    setVehicleMake(incident?.vehicle_make ?? "");
                    setVehicleModel(incident?.vehicle_model ?? "");
                    setVehicleColor(incident?.vehicle_color ?? "");
                    setVehicleYear(incident?.vehicle_year ?? "");

                    // Locate the image currently saved as the incident's best image.
                    const selectedImage = images.find(
                        (image: any) =>
                            image.id === incident?.best_image_id
                    );

                    // Reset first so incidents without a selected image show placeholder.
                    setThumbnailSource(null);

                    // Resolve the saved image path into a image source.
                    if (selectedImage?.file_path) {
                        const source = getMockImageSource(
                            selectedImage.file_path
                        );

                        if (source) {
                            setThumbnailSource(source);
                        }
                    }
                } catch (error) {
                    console.error(
                        "Failed to load incident information",
                        error
                    );
                }
            }

            void loadIncidentData();
        }, [id])
    );

    /**
     * Opens the photo selection screen for the incident.
     */
    function openChoosePhoto() {
        router.push({
            pathname: "/ChoosePhoto",
            params: {
                incident_id: id,
            },
        });
    }

    /**
     * Converts the stored incident timestamp into a local date/time.
     */
    function formatCapturedTime(value: string | string[] | undefined) {
        if (typeof value !== "string" || !value) {
            return "Unknown";
        }

        const numericValue = Number(value);
        const date = Number.isNaN(numericValue)
            ? new Date(value)
            : new Date(
                  numericValue < 10_000_000_000
                      ? numericValue * 1000
                      : numericValue
              );

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString([], {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    // Format the incident coordinates for display
    const coordinateText =
        typeof latitude === "string" && typeof longitude === "string"
            ? `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`
            : "Location unavailable";

    // Shared themed styling
    const sharedInputStyle = [
        styles.input,
        {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
        },
    ];

    // Shared themed styling
    const cardStyle = [
        styles.card,
        {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
    ];

    return (
        <KeyboardAvoidingView
            style={[
                styles.screen,
                { backgroundColor: theme.colors.background },
            ]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Incident Details
                </Text>

                <View
                    style={[
                        styles.photoContainer,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    {thumbnailSource ? (
                        <Image
                            source={thumbnailSource}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={[
                                styles.noImagePlaceholder,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            <Ionicons
                                name="image-outline"
                                size={36}
                                color={theme.colors.textSecondary}
                            />

                            <Text
                                style={[
                                    styles.noImageText,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                No Image
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.changePhotoButton,
                            { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={openChoosePhoto}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.changePhotoText}>
                            Change Photo
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Incident capture time and location */}
                <View style={styles.metadataRow}>
                    <View>
                        <Text
                            style={[
                                styles.metadataLabel,
                                { color: theme.colors.textSecondary },
                            ]}
                        >
                            CAPTURED
                        </Text>

                        <Text
                            style={[
                                styles.metadataValue,
                                { color: theme.colors.text },
                            ]}
                        >
                            {formatCapturedTime(created_time)}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.locationBadge,
                            { backgroundColor: theme.colors.surface },
                        ]}
                    >
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.locationText,
                                { color: theme.colors.text },
                            ]}
                        >
                            {coordinateText}
                        </Text>
                    </View>
                </View>

                {/* Injury severity selector. */}
                <View style={cardStyle}>
                    <Text
                        style={[
                            styles.sectionHeader,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        INJURY SEVERITY
                    </Text>

                    <View style={styles.severityRow}>
                        {SEVERITY_OPTIONS.map((severity) => {
                            const selected =
                                injurySeverity === severity;

                            return (
                                <TouchableOpacity
                                    key={severity}
                                    style={[
                                        styles.severityButton,
                                        {
                                            borderColor: selected
                                                ? theme.colors.primary
                                                : theme.colors.border,
                                            backgroundColor: selected
                                                ? theme.colors.primary
                                                : "transparent",
                                        },
                                    ]}
                                    onPress={() => {
                                        setInjurySeverity(severity);
                                        void saveIncidentField({
                                            injury_severity: severity,
                                        });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.severityText,
                                            {
                                                color: selected
                                                    ? "#ffffff"
                                                    : theme.colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        {severity}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Vehicle and descriptive information. */}
                <View style={cardStyle}>
                    <Text
                        style={[
                            styles.sectionHeader,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        VEHICLE
                    </Text>

                    <Text
                        style={[
                            styles.inputLabel,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        LICENSE PLATE
                    </Text>

                    <View
                        style={[
                            styles.licensePlateContainer,
                            {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background,
                            },
                        ]}
                    >
                        <TextInput
                            style={[
                                styles.licensePlateInput,
                                { color: theme.colors.text },
                            ]}
                            value={licensePlateInput}
                            onChangeText={(text) => {
                                setLicensePlateInput(text);
                                void saveIncidentField({
                                    license_plate: text,
                                });
                            }}
                            placeholder="ABC-1234"
                            placeholderTextColor={
                                theme.colors.textSecondary
                            }
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.fieldRow}>
                        <View style={styles.fieldColumn}>
                            <Text
                                style={[
                                    styles.inputLabel,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                MAKE
                            </Text>

                            <TextInput
                                style={sharedInputStyle}
                                value={vehicleMake}
                                onChangeText={(text) => {
                                    setVehicleMake(text);
                                    void saveIncidentField({
                                        vehicle_make: text,
                                    });
                                }}
                                placeholder="Toyota"
                                placeholderTextColor={
                                    theme.colors.textSecondary
                                }
                            />
                        </View>

                        <View style={styles.fieldColumn}>
                            <Text
                                style={[
                                    styles.inputLabel,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                MODEL
                            </Text>

                            <TextInput
                                style={sharedInputStyle}
                                value={vehicleModel}
                                onChangeText={(text) => {
                                    setVehicleModel(text);
                                    void saveIncidentField({
                                        vehicle_model: text,
                                    });
                                }}
                                placeholder="Corolla"
                                placeholderTextColor={
                                    theme.colors.textSecondary
                                }
                            />
                        </View>
                    </View>

                    <View style={styles.fieldRow}>
                        <View style={styles.fieldColumn}>
                            <Text
                                style={[
                                    styles.inputLabel,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                COLOR
                            </Text>

                            <TextInput
                                style={sharedInputStyle}
                                value={vehicleColor}
                                onChangeText={(text) => {
                                    setVehicleColor(text);
                                    void saveIncidentField({
                                        vehicle_color: text,
                                    });
                                }}
                                placeholder="White"
                                placeholderTextColor={
                                    theme.colors.textSecondary
                                }
                            />
                        </View>

                        <View style={styles.fieldColumn}>
                            <Text
                                style={[
                                    styles.inputLabel,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                YEAR
                            </Text>

                            <TextInput
                                style={sharedInputStyle}
                                value={vehicleYear}
                                onChangeText={(text) => {
                                    setVehicleYear(text);
                                    void saveIncidentField({
                                        vehicle_year: text,
                                    });
                                }}
                                placeholder="2022"
                                placeholderTextColor={
                                    theme.colors.textSecondary
                                }
                                keyboardType="numeric"
                                maxLength={4}
                            />
                        </View>
                    </View>
                </View>

                {/* Driver presence and optional details. */}
                <View style={cardStyle}>
                    <Text
                        style={[
                            styles.sectionHeader,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        DRIVER
                    </Text>

                    <View style={styles.switchRow}>
                        <Text
                            style={[
                                styles.switchLabel,
                                { color: theme.colors.text },
                            ]}
                        >
                            Driver Present at Scene
                        </Text>

                        <Switch
                            value={driverPresent}
                            onValueChange={(value) => {
                                setDriverPresent(value);
                                void saveIncidentField({
                                    driver_present: value ? 1 : 0,
                                });
                            }}
                            trackColor={{
                                false: theme.colors.border,
                                true: theme.colors.primary,
                            }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    <Text
                        style={[
                            styles.inputLabel,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        DRIVER INFORMATION
                    </Text>

                    <TextInput
                        style={[sharedInputStyle, styles.multilineInput]}
                        value={driverInfo}
                        onChangeText={(text) => {
                            setDriverInfo(text);
                            void saveIncidentField({
                                driver_information: text,
                            });
                        }}
                        placeholder={
                            driverPresent
                                ? "Enter driver information..."
                                : "No driver present"
                        }
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                    />
                </View>

                {/* Additional incident notes. */}
                <View style={cardStyle}>
                    <Text
                        style={[
                            styles.sectionHeader,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        NOTES
                    </Text>

                    <Text
                        style={[
                            styles.inputLabel,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        EXTRA COMMENTS
                    </Text>

                    <TextInput
                        style={[sharedInputStyle, styles.notesInput]}
                        value={extraComments}
                        onChangeText={(text) => {
                            setExtraComments(text);
                            void saveIncidentField({
                                extra_comment: text,
                            });
                        }}
                        placeholder="Any additional observations..."
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.deleteButton,
                        { borderColor: theme.colors.danger },
                    ]}
                    onPress={() => void handleDeleteIncident()}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.deleteButtonText,
                            { color: theme.colors.danger },
                        ]}
                    >
                        Delete Incident
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingBottom: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    photoContainer: {
        position: "relative",
        width: "100%",
        aspectRatio: 1.65,
        overflow: "hidden",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    noImagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    noImageText: {
        fontSize: 14,
        fontWeight: "600",
    },
    changePhotoButton: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
    },
    cameraIcon: {
        color: "#ffffff",
        fontSize: 15,
        marginRight: 7,
    },
    changePhotoText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    metadataRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    metadataLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    metadataValue: {
        fontSize: 13,
        fontWeight: "700",
    },
    locationBadge: {
        maxWidth: "58%",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 20,
    },
    locationIcon: {
        fontSize: 12,
        marginRight: 6,
    },
    locationText: {
        flexShrink: 1,
        fontSize: 11,
        fontWeight: "700",
    },
    card: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 12,
        marginBottom: 12,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.2,
        marginBottom: 14,
    },
    severityRow: {
        flexDirection: "row",
        gap: 7,
    },
    severityButton: {
        flex: 1,
        minHeight: 42,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 4,
    },
    severityText: {
        fontSize: 12,
        fontWeight: "700",
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.1,
        marginBottom: 7,
        marginTop: 2,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 15,
    },
    licensePlateContainer: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
    },
    plateIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    licensePlateInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 1.5,
        paddingVertical: 11,
    },
    fieldRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },
    fieldColumn: {
        flex: 1,
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    switchLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        marginRight: 12,
    },
    multilineInput: {
        minHeight: 82,
        textAlignVertical: "top",
    },
    notesInput: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    deleteButton: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 14,
        marginHorizontal: 12,
        marginTop: 2,
    },
    deleteIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: "800",
    },
});