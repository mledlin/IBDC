import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter} from "expo-router";
import {useState} from "react";
import {deviceSettings} from "../hooks/DeviceStatus.ts"

function DeviceStatusBar() {
    const [version, setVersion] = useState('1.0');
    const [battery, setBattery] = useState(3);
    const [paired, setPaired] = useState(false);

    function handleSetVersion() {
        let deviceSettings: object = getDeviceSettings();
        setVersion(deviceSettings.version);
    }
    function handleSetBattery() {
        setBattery(deviceSettings.battery);
    }
    function handleSetPaired() {
        setPaired(deviceSettings.paired);
    }
    return (
        <Text> {version} {battery} {paired} </Text>
    )
}

export default function MainScreen(){
  const router = useRouter();
  return (
      <View style={styles.container}>
        <Text style={styles.text}>Main Screen</Text>
          <Text> {DeviceStatusBar()} </Text>
       <Pressable style={styles.button} onPress={() => router.push("/PairDevice")}>
        <Text style={styles.buttonText}>Pair Device</Text>
       </Pressable>

       <Pressable style={styles.button} onPress={() => router.push("/IncidentHistory")}>
        <Text style={styles.buttonText}>Incident History</Text>
       </Pressable>
 
        <Pressable style={styles.button} onPress={() => router.push("/RideSessions")}>
        <Text style={styles.buttonText}>Ride Sessions</Text>
        </Pressable>
        
        <Pressable style={styles.button} onPress={() => router.push("/Settings")}>
        <Text style={styles.buttonText} >Settings</Text>
       </Pressable>
      </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
  },
  buttonText:{
    fontWeight: "bold",
    color: "white",
  },
  link: {
    fontSize: 18,
    color: "blue",
    textDecorationLine: "underline",
  },
  button: {
    padding: 20,
    backgroundColor: "blue", 
    marginBottom: 15, 
    borderRadius: 10
  }
});
