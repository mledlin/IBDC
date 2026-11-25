import React, {useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useTheme} from "@/context/ThemeContext";

const TUTORIAL_COMPLETED_KEY = "first_run_tutorial_completed";

const TUTORIAL_STEPS = [
    {
        icon: "bluetooth-outline" as const,
        title: "Connect your device",
        description:
            "From Home, tap Pair Device and connect your IBDC. You can also explore with the simulated device in Settings.",
    },
    {
        icon: "camera-outline" as const,
        title: "Capture an incident",
        description:
            "When connected, the IBDC records incidents and their photos. Find the captured incidents in Ride Sessions.",
    },
    {
        icon: "clipboard-outline" as const,
        title: "Review incident details",
        description:
            "Tap an incident to review it. Complete Injury, Severity of Pass, License Plate, and Color to clear its Review marker.",
    },
    {
        icon: "share-outline" as const,
        title: "Export a report",
        description:
            "Use Export Incident on the detail screen for a single incident, or the export button in Ride Sessions for a session report.",
    },
];

export default function Tutorial() {
    const {theme} = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [stepIndex, setStepIndex] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);
    const step = TUTORIAL_STEPS[stepIndex];
    const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;

    async function finishTutorial() {
        if (isFinishing) {
            return;
        }

        setIsFinishing(true);
        try {
            await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
            router.replace("/MainScreen");
        } catch (error) {
            console.error("Failed to save tutorial completion", error);
            Alert.alert(
                "Could Not Save",
                "The tutorial status could not be saved. Please try again.",
            );
        } finally {
            setIsFinishing(false);
        }
    }

    return (
        <View
            style={[
                styles.screen,
                {
                    backgroundColor: theme.colors.background,
                    paddingTop: insets.top + 24,
                    paddingBottom: insets.bottom + 20,
                },
            ]}
        >
            <View style={styles.topRow}>
                <Text style={[styles.stepCount, {color: theme.colors.textSecondary}]}>
                    {stepIndex + 1} of {TUTORIAL_STEPS.length}
                </Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => void finishTutorial()}
                    disabled={isFinishing}
                    hitSlop={8}
                >
                    <Text style={[styles.skipText, {color: theme.colors.primary}]}>
                        Skip
                    </Text>
                </Pressable>
            </View>

            <View
                style={[
                    styles.content,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radii.lg,
                    },
                ]}
            >
                <View
                    style={[
                        styles.iconCircle,
                        {backgroundColor: theme.colors.surfaceAlt},
                    ]}
                >
                    <Ionicons
                        name={step.icon}
                        size={42}
                        color={theme.colors.primary}
                    />
                </View>
                <Text style={[styles.title, {color: theme.colors.surfaceText}]}>
                    {step.title}
                </Text>
                <Text style={[styles.description, {color: theme.colors.surfaceTextSecondary}]}>
                    {step.description}
                </Text>
                <View style={styles.progressRow}>
                    {TUTORIAL_STEPS.map((item, index) => (
                        <View
                            key={item.title}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor: index === stepIndex
                                        ? theme.colors.primary
                                        : theme.colors.border,
                                },
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                {stepIndex > 0 ? (
                    <Pressable
                        accessibilityRole="button"
                        style={[styles.secondaryButton, {borderColor: theme.colors.border}]}
                        onPress={() => setStepIndex(stepIndex - 1)}
                    >
                        <Text style={[styles.secondaryButtonText, {color: theme.colors.surfaceText}]}>
                            Back
                        </Text>
                    </Pressable>
                ) : (
                    <View style={styles.secondaryButton} />
                )}

                <Pressable
                    accessibilityRole="button"
                    style={[
                        styles.primaryButton,
                        {
                            backgroundColor: theme.colors.primary,
                            borderRadius: theme.radii.md,
                            opacity: isFinishing ? 0.7 : 1,
                        },
                    ]}
                    onPress={() => {
                        if (isLastStep) {
                            void finishTutorial();
                        } else {
                            setStepIndex(stepIndex + 1);
                        }
                    }}
                    disabled={isFinishing}
                >
                    {isFinishing ? (
                        <ActivityIndicator color={theme.colors.primaryForeground} />
                    ) : (
                        <Text style={[styles.primaryButtonText, {color: theme.colors.primaryForeground}]}>
                            {isLastStep ? "Get Started" : "Next"}
                        </Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: 24,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 44,
    },
    stepCount: {
        fontSize: 14,
        fontWeight: "600",
    },
    skipText: {
        fontSize: 15,
        fontWeight: "700",
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        marginVertical: 20,
        padding: 28,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 14,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
    },
    progressRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 32,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    secondaryButton: {
        minWidth: 96,
        minHeight: 50,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 12,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "700",
    },
    primaryButton: {
        flex: 1,
        minHeight: 50,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: "700",
    },
});
