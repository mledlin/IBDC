import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';

type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

//Information that represents the IBDC device for main screen representation. 
interface DeviceInfo {
  name: string; 
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
function BatteryBar({ level }: { level : number}) {
  const color = level > 50 ? 'green' : level > 20 ? '#ffd166' : '#ff6b6b'
  return(
    <View style={styles.batteryWrapper}>
      <View style={styles.batteryOter}>
        <View style={[styles.batteryFill, { width: `${level}%` as any, backgroundColor: color}]} />
      </View>
    </View>
  )
}

//function to dispay the storage level of device on the screen 
function StroageBar({used, total}: {used: number, total: number}){

}

//function for pair status of the device on the screen 

export default function MainScreen(){
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [device] = useState<DeviceInfo>(demoDevice);
  return (
    <View style={[styles.safe, {paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.scroll]}>
          <View style={styles.statHeader}>
            <Ionicons name="bluetooth" size={16} color={'blue'}/>
            <Text style={styles.statTitle}>Device</Text>
          </View>
            <Pressable style={styles.button} onPress={() => router.push("/PairDevice")}>
            <Text style={styles.buttonText}>Pair Device</Text>
            </Pressable>
          </View>

        <View style={[styles.statCard, styles.scroll]}>
          <View style={styles.statHeader}>
            <Ionicons name="battery-half-outline" size={16} color={'black'}/>
            <Text style={styles.statTitle}>Device Battery</Text>
            </View>
            <Text style={[styles.statBigNumber]}>{device.battery}%</Text>
            <BatteryBar level={device.battery} />
        </View>

         <View style={[styles.statCard, styles.scroll]}>
          <View style={styles.statHeader}>
        <Ionicons name="server-outline" size={16} color={'red'}/>
        <Text style={styles.statTitle}>Device storage</Text>
        </View>
        </View>
      </View>
      <View style={styles.imageCard}>
        <View style={styles.imageGlow}>
        <Image
        source={require('../assets/images/device-placeholder.png')} 
        style ={styles.productImage}
        resizeMode = "contain" 
        />
        </View>
      </View>
      <View style={styles.container}>
        

      
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
      </ScrollView>
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
    backgroundColor: "#5e7ac9", 
    marginBottom: 15, 
    borderRadius: 10,
  }, 
  batteryWrapper: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
  batteryOter: {
    flex: 1, 
    height: 8, 
    backgroundColor: 'grey', 
    borderRadius: 4, 
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  batteryText: {
    fontSize: 11, 
    fontWeight: '700',
  },
  safe: {
    flex: 1, 
    backgroundColor: "white",
  },
  scroll: {
    flex: 1,
  }, 
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'rgb(227, 233, 238)', 
    borderRadius: 20, 
    borderWidth: 5, 
    borderColor: 'grey', 
    padding: 9,
  },
  statHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 8,
  },
  statBigNumber: {
    fontSize: 28, 
    fontWeight: '800', 
    color: 'grey', 
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 12, 
    color: 'black',
    fontWeight: '600',
  },
  imageCard: {
    backgroundColor: 'grey', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: 'grey', 
    padding: 20,
    alignItems: 'center', 
    marginBottom: 14, 
    overflow: 'hidden',
  },
  imageGlow:{
    position: 'absolute', 
    top: -40, 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: "black",
    opacity: 0.04,
  },
  productImage: { 
    width: '100%', 
    height: 170, 
    marginBottom: 16,
  },


});
