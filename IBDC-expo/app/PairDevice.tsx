import React, { useState } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import BluetoothDeviceModal from "@/components/ui/BluetoothDeviceModal";

export default function PairDevice() {
  const [modalVisable, setModalVisable] = useState(false);
  //add some pretend devices here 
  //add a method here to handle the selected devices from the modal
  //make a pair button in view. 
  return (
    <View style={styles.container}>
      <Text style={styles.helloWorldTitle}>Bluetooh Pairing here</Text>
      <ActivityIndicator size = {"large"}/>
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
  },
  //defining your own style
  helloWorldTitle: {
    color: "red",
  },
  image: {
    width: 200,
    height: 200,
  },
});
