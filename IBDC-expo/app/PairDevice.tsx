import React, { useState } from "react";
import { Text, View, StyleSheet, Alert, Pressable } from "react-native";
import BluetoothDeviceModal from "@/components/ui/BluetoothDeviceModal";

export default function PairDevice() {
  const [modalVisable, setModalVisable] = useState(false);
  const [devices, setDevices] = useState([
    {id: "Pretend BT ID#1", name: "IBDC Device"},
    {id: "Pretend BT ID#2", name: null },
  ]);
 const handleSelectDevice = (device: {id: string; name: string | null }) => {
  setModalVisable(false);
  Alert.alert("Selected Device", `${device.name || "Unnamed Device"}\n${device.id}`);
 };
  
  return (
    <View style={styles.container}>
      <Text>Bluetooth Menu</Text>
      <Pressable style={styles.button} onPress={() => setModalVisable(true)}>
      <Text style={styles.buttonText}>Pair Device</Text>
      </Pressable>
  
      <BluetoothDeviceModal
      visible={modalVisable}
      devices={devices}
      onClose={()=> setModalVisable(false)}
      onSelectDevice={handleSelectDevice}
      />
    </View>
  );
}
//this is where styles are defined. This is a stlye sheet and it is the most common way to 
//make styles in react native. 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
    padding: 40,
    backgroundColor: "blue", 
    marginBottom: 15, 
    borderRadius: 30
  },
  buttonText:{
    fontWeight: "bold",
    color: "white",
  },
});
