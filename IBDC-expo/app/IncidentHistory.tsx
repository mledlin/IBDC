import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([
    { id: "1", title: "Incident 1" },
    { id: "2", title: "Incident 2" },
    { id: "3", title: "Incident 3" },
    { id: "4", title: "Incident 4" },
  ]);

  const [incidentTitle, setIncidentTitle] = useState("");

  const addIncident = () => {
    if (!incidentTitle.trim()) return;

    const newIncident = {
      id: Date.now().toString(),
      title: incidentTitle,
    };

    setIncidents((prev) => [newIncident, ...prev]);

    router.push({
      pathname: "/IncidentDetail",
      params: { id: newIncident.id, title: newIncident.title },
    });

    setIncidentTitle("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Incident History</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter incident"
        value={incidentTitle}
        onChangeText={setIncidentTitle}
      />

      <TouchableOpacity style={styles.button} onPress={addIncident}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              router.push({
                pathname: "/IncidentDetail",
                params: { id: item.id, title: item.title },
              })
            }
          >
            <Text style={styles.itemText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 18,
    color: "black",
  },
  link: {
    fontSize: 18,
    color: "blue",
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
});