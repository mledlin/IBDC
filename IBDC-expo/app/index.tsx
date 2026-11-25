import React, {useEffect, useState} from "react";
import {ActivityIndicator, View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useRouter} from "expo-router";

export default function Index() {
    const router = useRouter();
    const [isCheckingTutorial, setIsCheckingTutorial] = useState(true);

    useEffect(() => {
        async function routeFirstLaunch() {
            try {
                const tutorialCompleted =
                    await AsyncStorage.getItem("first_run_tutorial_completed");
                router.replace(
                    tutorialCompleted === "true" ? "/MainScreen" : "/Tutorial",
                );
            } catch (error) {
                console.error("Failed to load first-run tutorial status", error);
                router.replace("/MainScreen");
            } finally {
                setIsCheckingTutorial(false);
            }
        }

        void routeFirstLaunch();
    }, [router]);

    return isCheckingTutorial ? (
        <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
            <ActivityIndicator />
        </View>
    ) : null;
}