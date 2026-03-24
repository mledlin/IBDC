import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

//Information that represents the IBDC device for main screen representation. 
interface DeviceInfo {
  name: string 
  status: ConnectedStatus;
  battery: number;
  storage: {used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
}

//mock device for demonstration. Will need to be removed for final product
const demoDevice: DeviceInfo = {
name: 'IBDC Proto X',
status: 'connected',
battery: 78, 
storage: {used: 3.4, total: 8},
firmwareVersion: 'v1.0',
lastSynced: '2 min ago',
};

//function to display the battery level of device on the screen 
function BateryBar({ level }: { level : number}) {
  const color = level > 50 ? 'green' : level > 20 ? '#ffd166' : '#ff6b6b'
  return(
    <View style={styles.batteryWrapper}>
      <View>
      </View>
      <Text>{level}%</Text>
    </View>
  )
}

//function to dispay the storage level of device on the screen 
function StroageBar({used, total}: {used: number, total: number}){

}

//function for pair status of the device on the screen 

export default function MainScreen(){
  const router = useRouter();
  
  return (
      <View style={styles.container}>
        <Text style={styles.text}>Main Screen</Text>

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
    borderRadius: 10,
  }, 
  batteryWrapper: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
});
