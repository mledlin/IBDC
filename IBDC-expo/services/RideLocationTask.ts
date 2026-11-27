import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { SAMPLE_INTERVAL_MS, type GPSFix } from "./GPSOffset";

const TASK = "ibdc-active-ride-location";
export const rideAccuracy = Platform.OS === "ios" ? Location.Accuracy.Highest : Location.Accuracy.High;
type Listener = (fix: GPSFix) => void;
let listener: Listener | undefined;
let operation = Promise.resolve();

// Serialize native registration changes across disconnects and rapid reconnections.
function schedule(action: () => Promise<void>): Promise<void> {
    const result = operation.then(action);
    operation = result.catch(error => console.warn("Ride GPS registration failed", error));
    return result;
}

async function stopIfIdle(): Promise<void> {
    if (!listener && await Location.hasStartedLocationUpdatesAsync(TASK)) {
        await Location.stopLocationUpdatesAsync(TASK);
    }
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    if (!listener) {
        // A cold launch has no connected ride and no in-memory history.
        await schedule(stopIfIdle);
        return;
    }
    if (error) {
        console.warn("Ride GPS update failed", error.message);
        return;
    }
    for (const fix of data.locations) listener(fix);
});

export function subscribeRideLocation(onFix: Listener, onStarted: () => void): () => void {
    listener = onFix;
    async function start() {
        if (Platform.OS === "web") return;
        if (Platform.OS === "ios" && !(await Location.requestBackgroundPermissionsAsync()).granted) return;
        await schedule(async () => {
            if (listener !== onFix) return;
            await Location.startLocationUpdatesAsync(TASK, {
                accuracy: rideAccuracy,
                timeInterval: SAMPLE_INTERVAL_MS,
                distanceInterval: 0,
                deferredUpdatesInterval: 0,
                deferredUpdatesDistance: 0,
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
                activityType: Location.ActivityType.Fitness,
                foregroundService: {
                    notificationTitle: "IBDC ride in progress",
                    notificationBody: "Recording GPS for incident locations.",
                    killServiceOnDestroy: true,
                },
            });
            if (listener === onFix) onStarted();
        });
    }
    void start().catch(error => console.warn("Locked-screen GPS unavailable", error));
    return () => {
        if (listener !== onFix) return;
        listener = undefined;
        void schedule(stopIfIdle);
    };
}
