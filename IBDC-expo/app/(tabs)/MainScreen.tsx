import { View, Text, StyleSheet } from "react-native";
import {Link} from "expo-router";

export default function MainScreen(){
  return (
      <View style={styles.container}>
        <Text style={styles.text}>Main Screen</Text>
        <Link href="/(tabs)/Settings" style={styles.link}>
          Go to Settings
        </Link>
        
        <Link href="/(tabs)/IncidentHistory" style={styles.link}>
          Go to Incident History
        </Link>
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
  link: {
    fontSize: 18,
    color: "blue",
    textDecorationLine: "underline",
  },
});
