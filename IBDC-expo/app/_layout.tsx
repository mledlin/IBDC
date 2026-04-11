import { Stack } from "expo-router";
import { DeviceProvider } from "@/context/DeviceContext";

export default function AppLayout() {
    

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
    </Stack>
    </DeviceProvider>
    );
}
