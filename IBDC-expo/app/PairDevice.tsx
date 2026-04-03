import React, { useState } from "react";
import { Text, View, StyleSheet, Alert, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BluetoothDeviceModal from "@/components/ui/BluetoothDeviceModal";
import { useDevice } from "@/context/DeviceContext";
import { useRouter } from "expo-router";

type DeviceItem = {
  id: string;
  name: string;
  battery: number;
  storage: { used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
};

const COLORS = {
  primaryBlue: "#2563eb",
  darkBlue: "#1e3a8a",
  lightBlue: "#eff6ff",

  primaryRed: "#dc2626",
  lightRed: "#fee2e2",

  textDark: "#111827",
  textLight: "#6b7280",

  border: "#e5e7eb",
  background: "#f8fafc",
  white: "#ffffff",
};

export default function PairDevice() {
  const router = useRouter();
  const {setDevice}= useDevice();
  const [modalVisible, setModalVisable] = useState(false);
  const [devices, setDevices] = useState([
    {id: "Pretend BT ID#1", name: "IBDC Device1", battery: 20, storage: {used: 6.9, total: 8}, firmwareVersion: "v1.0", lastSynced: "Just now"},
    {id: "Pretend BT ID#2", name: "IBDC Device2",  battery: 100, storage: {used: 1.0, total: 8}, firmwareVersion: "v1.2", lastSynced: "2 minutes ago"},
  ]);

 const handleSelectDevice = (device: (DeviceItem)) => {
  setModalVisable(false);
  setDevice({
    id: device.id, 
    name: device.name || "Unnamed Device", 
    status: "connected",
    battery: device.battery,
    storage: device.storage,
    firmwareVersion: device.firmwareVersion,
    lastSynced: device.lastSynced,
  })
  router.back();
 };
  
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Pair Device</Text>
      </View>
      
      <View style={styles.container}>
        <View style={styles.pictureCard}>
          <View style={styles.iconBackdrop}>
            <Ionicons name ="bluetooth" size={34} color={COLORS.primaryBlue}/>
          </View>
          <Text style= {styles.title}>Connect your IBDC device</Text>
          <Text style={styles.subtitle}>
            Turn on Bluetooth, make sure your device is nearby, and tab the button 
            beloww to search for available devices.
          </Text>
        
        <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.primaryRed}
            />
            <Text style={styles.infoText}>
              Keep the device powered on during pairing.
            </Text>
            </View>
          </View>

        <Pressable style={styles.button} onPress={() => setModalVisable(true)}>
       <Ionicons name="bluetooth-outline" size={18} color="white" />
      <Text style={styles.buttonText}>Scan for Devices</Text>
      </Pressable>

      
      
      <BluetoothDeviceModal
      visible={modalVisible}
      devices={devices}
      onClose={()=> setModalVisable(false)}
      onSelectDevice={handleSelectDevice}
      />
      </View>
    </View>
  );
}
//this is where styles are defined. This is a stlye sheet and it is the most common way to 
//make styles in react native. 
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.darkBlue,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 16,
  },
  //defining your own style
  helloWorldTitle: {
    color: "red",
  },
  image: {
    width: 200,
    height: 200,
  },
    button: {
    width: "100%",
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,

    shadowColor: COLORS.darkBlue,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  buttonText:{
    fontWeight: "bold",
    color: "white",
  },
  pictureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  iconBackdrop: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 18,
  },
  infoBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.lightRed,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
  },

});
