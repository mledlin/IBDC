import { router, useLocalSearchParams} from "expo-router";
import { useState } from "react";
import { updateIncidentBestImage } from "./database";
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from "react-native";
const{ width} = Dimensions.get("window");
const card_fit = width - 40;


export default function ChoosePhoto() {
const {incident_id } = useLocalSearchParams();
//mock data filling in for database
    const photoList = [
      {id: 'example1', title: 'Photo 1', image: require("@/assets/images/example.jpg"),},
      {id: 'example2', title: 'Photo 2', image: require("@/assets/images/example2.jpg"),},
      {id: 'example3', title: 'Photo 3', image: require("@/assets/images/example3.jpg"),},
      {id: 'example4', title: 'Photo 4', image: require("@/assets/images/example4.jpg"),},
    ];
  
  async function handleSelectPhoto(photoId: any) {
  try{
    if(typeof incident_id !== "string"){
      return;
    }
    await updateIncidentBestImage(incident_id, `${incident_id}-${photoId}`);

    console.log("Selected Photo:", photoId);
    router.back();
  }
  catch (error) {
    console.error("Failed to update best image", error);
  
}
}
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Choose the best photo</Text>
  
        <FlatList
          data={photoList}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style = {styles.cardWrap}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectPhoto(item.id)}>
                <Image source = {item.image} style = {styles.image} resizeMode = "cover" />
              <Text style={styles.itemText}>{item.title}</Text>
            </TouchableOpacity>
            </View>
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
    itemText: {
      fontSize: 18,
      color: "black",
    },
    card: {
      width: card_fit,
      backgroundColor: "#ffffff",
      borderRadius: 12,
      padding: 15,
      alignItems: "center",
      },
      image: {
        width: "100%",
        height: 300,
        borderRadius: 10,
        marginBottom: 12,
      },
      cardWrap: {
        width,
        alignItems: "center",
      },
  });