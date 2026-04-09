import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from "@/context/DeviceContext";


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

//function to display the Storage level of device on the screen 
function StorageBar({ level }: { level : number}) {
  const color = level > 90 ? '#ff6b6b' : level > 70 ? '#ffd166' : 'green'
  return(
    <View style={styles.batteryWrapper}>
      <View style={styles.batteryOter}>
        <View style={[styles.batteryFill, { width: `${level}%` as any, backgroundColor: color}]} />
      </View>
    </View>
  )
}


//function to get status of connection
function getStatusColor(status: ConnectedStatus) {
  switch (status) {
    case "connected":
      return "#16a341";
    case "pairing":
      return "#d97706"; 
    case "disconnected":
      return "#6b7280";
  }
}

//allow the connected style to change the apperace 
function getStatusText(status: ConnectedStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "pairing":
      return "Pairing";
    case "disconnected":
      return "Disconnected";
    default:
      return "Unknown";
  }
}


//function for pair status of the device on the screen 

export default function MainScreen(){
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {device}= useDevice();
  const currentDevice = device ?? demoDevice;
  return (
    <View style={[styles.safe, {paddingTop: insets.top }]}>
      <ScrollView 
      style={styles.scroll} 
      contentContainerStyle={styles.content} 
      showsVerticalScrollIndicator={false}
      >
      <View style={styles.statsRow}>
        <View style={[styles.statCard]}>
          <View style={styles.statHeader}>
            <Ionicons name="bluetooth" size={18} color={'#2563eb'}/>
            <Text style={styles.statTitle}>{getStatusText(currentDevice.status)}</Text>
          </View>
            <Pressable 
            style={styles.button} 
            onPress={() => router.push("/PairDevice")}
            >
            <Text style={styles.buttonText}>Pair Device</Text>
            </Pressable>
          </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="battery-half-outline" size={18} color={'#111827'}/>
            <Text style={styles.statTitle}>Battery</Text>
            </View>
            <Text style={[styles.statBigNumber]}>{currentDevice.battery}%</Text>
            <BatteryBar level={currentDevice.battery} />
        </View>

         <View style={styles.statCard}>
          <View style={styles.statHeader}>
        <Ionicons name="server-outline" size={18} color={'#111827'}/>
        <Text style={styles.statTitle}>Device storage</Text>
        </View>
         <Text style={[styles.statBigNumber]}>{(currentDevice.storage.used/currentDevice.storage.total)*100}%</Text>
            <StorageBar level={(currentDevice.storage.used/currentDevice.storage.total)*100} />
        </View>
      </View>

      <View style={styles.imageCard}>
        <Text style={styles.batteryText}>IBDC</Text>
        <Image
        source={require('../assets/images/device-placeholder.png')} 
        style ={styles.productImage}
        resizeMode = "contain" 
        />
        <Text style={styles.batteryText}>
          Firmware {currentDevice.firmwareVersion} • Synced {currentDevice.lastSynced}
        </Text>
      </View>
     
   <View style={styles.actionsCard}>
  <View style={styles.actionsRow}>
    <Pressable
      style={styles.actionButtonSmall}
      onPress={() => router.push("/IncidentHistory")}
    >
      <Ionicons name="warning-outline" size={18} color="white" />
      <Text style={styles.actionButtonSmallText}>Incident{"\n"}History</Text>
    </Pressable>

    <Pressable
      style={styles.actionButtonSmall}
      onPress={() => router.push("/RideSessions")}
    >
      <Ionicons name="bicycle-outline" size={18} color="white" />
      <Text style={styles.actionButtonSmallText}>Ride Sessions</Text>
    </Pressable>

    <Pressable
      style={styles.actionButtonSmall}
      onPress={() => router.push("/Settings")}
    >
      <Ionicons name="settings-outline" size={18} color="white" />
      <Text style={styles.actionButtonSmallText}>Settings</Text>
    </Pressable>
  </View>
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
  actionsCard: {
  backgroundColor: "#ffffff",
  borderRadius: 24,
  borderWidth: 1,
  borderColor: "#f3f2f7",
  padding: 14,
  marginTop: 4,

  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
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
    backgroundColor: "#1e3a8a", 
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
    backgroundColor: "#215097",
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
    backgroundColor: '#ffffff', 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: "#ffffff", 
    padding: 12,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
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
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f3f2f7",
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
    height: 260, 
    marginBottom: 16,
  },
  actionsRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 4,
  },
  actionButtonSmall: {
    flex: 1,
    backgroundColor: "#1e3a8a",
    borderRadius: 16,
    minHeight: 82,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  actionButtonSmallText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 16,
  },
});
