import { Stack } from "expo-router";
import { DeviceProvider } from "@/context/DeviceContext";
import { initDatabase } from "./database";
import { useEffect } from "react";

export default function AppLayout() {
    useEffect(() => {
        async function setupDatabase(){
            try {
                await initDatabase();
                console.log("Database Init");
            } catch (error) {
                console.error("Database init failed", error);
            }
        }

        setupDatabase();
    }, []);

    return (
        <DeviceProvider>
        <Stack
        screenOptions={{
           headerStyle: {backgroundColor: 'red'},
        headerTintColor: 'white' 
        }}
        >
       <Stack.Screen name="MainScreen" options={{title: 'Home'}}/>
        <Stack.Screen name="IncidentDetail" options={{title: 'Incident Details'}}/>
        <Stack.Screen name="PairDevice" options={{title: 'Pair'}}/>
        <Stack.Screen name="RideSessions" options={{title: 'Ride Sessions'}}/>
        <Stack.Screen name="Settings" options={{title: 'Settings'}}/>
        <Stack.Screen name="ChoosePhoto" options={{title: "Choose Photo"}} />
    </Stack>
    </DeviceProvider>
    );
}
