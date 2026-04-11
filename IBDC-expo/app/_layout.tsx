import { Stack } from "expo-router";
import { DeviceProvider } from "@/context/DeviceContext";
import { View, Text, Image } from "react-native";
import { ThemeProvider, useTheme} from "@/context/ThemeContext";

function AppStack() {
  const { theme } = useTheme();
    
    return (
        <Stack
        screenOptions={{
        headerStyle: {
            backgroundColor: theme.colors.surface,
        },
        headerTitleAlign: "center",
        headerTintColor: theme.colors.returnArrow,
        headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
        },
        headerShadowVisible: false,
        headerLargeTitleEnabled: true,
        headerTitle: () => (
  <View style={{ 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingBottom: 30, 
    paddingTop: 50,
    }}>
    <Image
      source={require("../assets/images/logo.png")}
      style={{ width: 24, height: 24 }}
    />
    <Text style={{ fontWeight: "700", fontSize: 18, color: "#0F172A" }}>
      IBDC
    </Text>
  </View>
),
    }}
        >
       <Stack.Screen name="MainScreen" options={{title: 'Home'}}/>
        <Stack.Screen name="IncidentHistory" options={{title: 'History'}}/>
        <Stack.Screen name="IncidentDetail" options={{title: 'Incident Details'}}/>
        <Stack.Screen name="PairDevice" options={{title: 'Pair'}}/>
        <Stack.Screen name="RideSessions" options={{title: 'Ride Sessions'}}/>
        <Stack.Screen name="RideDetail" options={{title: 'Ride Details'}}/>
        <Stack.Screen name="Settings" options={{title: 'Settings'}}/>
    </Stack>
    );
}

export default function AppLayout() {
  return (
    <ThemeProvider>
      <DeviceProvider>
        <AppStack />
      </DeviceProvider>
    </ThemeProvider>
  )
}
