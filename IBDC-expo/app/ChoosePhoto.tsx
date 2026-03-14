import { router } from "expo-router";
import { useState } from "react";
import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";

const handleBack = () => {
    console.log('photo selceted');
    router.back();
}
export default function ChoosePhoto() {

    const SessionLists = [
      {id: 'PHOTO 1', title: 'Photo 1'},
      {id: 'PHOTO 2', title: 'Photo 2'},
      {id: 'PHOTO 3', title: 'Photo 3'},
      {id: 'PHOTO 4', title: 'Photo 4'},
    ]
  
  
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Choose the best photo</Text>
  
        <FlatList
          data={SessionLists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={handleBack}
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