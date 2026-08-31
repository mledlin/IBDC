/**
 * Device pairing screen.
 *
 * This screen gives a simple pairing workflow.
 */

import React, { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BluetoothDeviceModal from "@/components/ui/BluetoothDeviceModal";
import { useDevice } from "@/context/DeviceContext";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

/**
 * Represents one selectable Bluetooth device shown.
 */
type DeviceItem = {
  id: string;
  name: string;
  battery: number;
  storage: { used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
};

/**
 * Fallback color constants used in the stylesheet.
 *
 * Mostly overridden by the active theme.
 */
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

/**
 * Renders the pairing screen and manages device selection.
 *
 * This component:
 * - Displays a short pairing guide.
 * - Shows the Bluetooth device.
 * - Stores the chosen device in DeviceContext.
 *
 * @returns The pair-device screen UI.
 */
export default function PairDevice() {
  const { theme } = useTheme();
  const router = useRouter();
  const {setDevice}= useDevice();
  const [modalVisible, setModalVisable] = useState(false);
  const [devices, setDevices] = useState([
    {id: "Pretend BT ID#1", name: "IBDC Device1", battery: 20, storage: {used: 6.9, total: 8}, firmwareVersion: "v1.0", lastSynced: "Just now"},
    {id: "Pretend BT ID#2", name: "IBDC Device2",  battery: 100, storage: {used: 1.0, total: 8}, firmwareVersion: "v1.2", lastSynced: "2 minutes ago"},
  ]);

  /**
   * Saves the chosen device into shared device state, marks it as connected, closes the modal,
   * and returns to the previous screen.
   *
   * @param device The device selected from the modal list.
   */
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
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.headerText, { color: theme.colors.primaryForeground }]}>Pair Device</Text>
      </View>
      
      <View style={styles.container}>
        <View style={[styles.pictureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.iconBackdrop, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }]}>
            <Ionicons name ="bluetooth" size={40} color={theme.colors.primaryForeground}/>
          </View>
          <Text style= {[styles.title, { color: theme.colors.textSecondary }]}>Connect your IBDC device</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Turn on Bluetooth, make sure your device is nearby, and tab the button 
            below to search for available devices.
          </Text>
        
        <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.colors.danger}
            />
            <Text style={[styles.infoText, { color: theme.colors.danger }]}>
              Keep the device powered on during pairing.
            </Text>
            </View>
          </View>

        <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={() => setModalVisable(true)}>
       <Ionicons name="bluetooth-outline" size={18} color={theme.colors.primaryForeground} />
      <Text style={[styles.buttonText, { color: theme.colors.primaryForeground }]}>Scan for Devices</Text>
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
    borderRadius: 24,
    borderWidth: 1,
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
