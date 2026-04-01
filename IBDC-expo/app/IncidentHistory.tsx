import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image} from "react-native";
import { router} from "expo-router";

export default function IncidentHistory() {
    //Initializing list using state so we can add or update incidents later on 
    //Thumbnail is just mock for presentation
  const [incidents, setIncidents] = useState([
    { id: "1", title: "Incident 1", thumbnail: require("@/assets/images/example.jpg"), },
    { id: "2", title: "Incident 2", thumbnail: require("@/assets/images/example2.jpg"),},
    { id: "3", title: "Incident 3", thumbnail: require("@/assets/images/example3.jpg"), },
    { id: "4", title: "Incident 4", thumbnail: require("@/assets/images/example4.jpg"),},
  ]);

  //Function that will allow new incidents to be added to the state in the future
  const addIncident = (title : string) => {
    const newIncident = {
      id: Date.now().toString(),
      title: title,
      //Filler, eventually this will require .filepath from db
      thumbnail: require(""),
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
            onPress={() => 
                router.push({
                    pathname: "/IncidentDetail",
                    params: {id: item.id, title: item.title},
                })
            }
          >
            <View style = {styles.itemContent}>
              <Image source = {item.thumbnail} style = {styles.thumbnail} resizeMode = "cover" />
            <Text style={styles.itemText}>{item.title}</Text>
            </View>
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

  itemContent: {
    flexDirection: "column",
    alignItems: "center",
  },

  thumbnail: {
    width: 140,
    height: 140,
    borderRadius: 6,
    marginRight: 12,
  },
});