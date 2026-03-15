import { router } from "expo-router";
import { useState } from "react";
import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";

export default function RideSessions() {

    const SessionLists = [
      {id: 'Ride 1', title: 'January 5th'},
      {id: 'Ride 2', title: 'January 6th'},
      {id: 'Ride 3', title: 'January 7th'},
      {id: 'Ride 4', title: 'January 8th'},
    ]
  
  
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Session History</Text>
  
        <FlatList
          data={SessionLists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => 
                  router.push({
                      pathname: "/RideDetail",
                      params: {id: item.id, title: item.title},
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
