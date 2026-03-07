import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function IncidentHistory() {
    //Initializing list using state so we can add or update incidents later on 
  const [incidents, setIncidents] = useState([
    { id: "1", title: "Incident 1" },
    { id: "2", title: "Incident 2" },
    { id: "3", title: "Incident 3" },
    { id: "4", title: "Incident 4" },
  ]);

  //Function that will allow new incidents to be added to the state in the future
  const addIncident = (title : string) => {
    const newIncident = {
      id: Date.now().toString(),
      title: title,
    };

    setIncidents((prevIncidents) => [...prevIncidents, newIncident]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Incident History</Text>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            //Pressing button just logs for now, but in the future we will
            //access the reports
            onPress={() => console.log(item.title)}
          >
            <Text style={styles.itemText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <Link href="/(tabs)/MainScreen" style={styles.link}>
        Go to Main Screen
      </Link>
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