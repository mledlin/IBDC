import { Text, View, StyleSheet, ActivityIndicator } from "react-native";

export default function PairDevice() {
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
