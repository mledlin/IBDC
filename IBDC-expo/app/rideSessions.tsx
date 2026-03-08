import { Text, View, StyleSheet } from "react-native";

export default function rideSessions() {
  return (
    <View style={styles.container}>
      <Text>Ride sessions</Text>
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
