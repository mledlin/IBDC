import * as Location from "expo-location";
import type { LocationSource } from "@/hooks/ActiveSession";
import { rideAccuracy, subscribeRideLocation } from "@/services/RideLocationTask";

export const expoLocationSource: LocationSource = {
    async requestPermission() {
        return (await Location.requestForegroundPermissionsAsync()).granted;
    },
    subscribe: subscribeRideLocation,
    read() {
        return Location.getCurrentPositionAsync({
            accuracy: rideAccuracy,
            timeInterval: 0,
            mayShowUserSettingsDialog: false,
        });
    },
};
