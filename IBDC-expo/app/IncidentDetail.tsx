import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function IncidentDetail() {
  const { id, title } = useLocalSearchParams();

  return (
    <View style={styles.container}>
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
});