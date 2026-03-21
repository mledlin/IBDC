import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function IncidentDetail() {
  const { id, title } = useLocalSearchParams();

  const [descriptionInput, setDescriptionInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [incident, setIncident] = useState({
    id,
    title,
    location: "",
    description: "",
  });

  const handleSave = () => {
    setIncident({
      ...incident,
      location: locationInput,
      description: descriptionInput,
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => router.push("/ChoosePhoto")}>
        <Text style={styles.buttonText}>Main Photo Here</Text>
      </Pressable>

      <Text style={styles.text}>Incident ID: {incident.id}</Text>
      <Text style={styles.text}>Incident Title: {incident.title}</Text>
      <Text style={styles.text}>Location: {incident.location}</Text>
      <Text style={styles.text}>Description: {incident.description}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={locationInput}
        onChangeText={setLocationInput}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={descriptionInput}
        onChangeText={setDescriptionInput}
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Data</Text>
      </Pressable>
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
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: "black",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },
  button: {
    padding: 20,
    backgroundColor: "blue",
    marginBottom: 15,
    borderRadius: 10,
  },
});