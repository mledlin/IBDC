import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function IncidentDetail() {
  const { id, title } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => router.push("/ChoosePhoto")}>
              <Text style={styles.buttonText}>Main Photo Here</Text>
             </Pressable>
      <Text style={styles.text}>Incident ID: {id}</Text>
      <Text style={styles.text}>Incident Title: {title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
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
    borderRadius: 10
  }
});