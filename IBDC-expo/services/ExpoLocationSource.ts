import * as Location from "expo-location";
import { Platform } from "react-native";
import type { LocationSource } from "@/hooks/ActiveSession";

export const expoLocationSource: LocationSource = {
    async requestPermission() {
        return (await Location.requestForegroundPermissionsAsync()).granted;
    },
    read() {
        return Location.getCurrentPositionAsync({
            accuracy: Platform.OS === "ios" ? Location.Accuracy.Highest : Location.Accuracy.High,
            mayShowUserSettingsDialog: false,
        });
    },
};
