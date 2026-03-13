import { Stack } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
    

    return (
        <Stack
        screenOptions={{
           headerStyle: {backgroundColor: 'red'},
        headerTintColor: 'white' 
        }}
        >
       <Stack.Screen name="MainScreen" options={{title: 'Home'}}/>
        <Stack.Screen name="IncidentHistory" options={{title: 'Histroy'}}/>
        <Stack.Screen name="IncidentDetail" options={{title: 'Details'}}/>
        <Stack.Screen name="PairDevice" options={{title: 'Pair'}}/>
        <Stack.Screen name="RideSessions" options={{title: 'Sessions'}}/>
        <Stack.Screen name="RideDetails" options={{title: 'Ride'}}/>
        <Stack.Screen name="Settings" options={{title: 'Settings'}}/>
    </Stack>
    );
}
