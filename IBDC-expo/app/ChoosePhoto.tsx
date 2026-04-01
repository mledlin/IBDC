import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View, StyleSheet, FlatList, Image, Button, TouchableOpacity } from "react-native";
import * as ImagePicker from 'expo-image-picker'


export default function ChoosePhoto() {
const [image, setImage] = useState<string | null> (null);
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from "react-native";
const{ width} = Dimensions.get("window");
const card_fit = width - 40;
const handleBack = () => {
    console.log('photo selected');
    router.back();
}
export default function ChoosePhoto() {
//mock data filling in for database
    const photoList = [
      {id: 'PHOTO 1', title: 'Photo 1', image: require("@/assets/images/example.jpg"),},
      {id: 'PHOTO 2', title: 'Photo 2', image: require("@/assets/images/example2.jpg"),},
      {id: 'PHOTO 3', title: 'Photo 3', image: require("@/assets/images/example3.jpg"),},
      {id: 'PHOTO 4', title: 'Photo 4', image: require("@/assets/images/example4.jpg"),},
    ];
  
  
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Choose the best photo</Text>
        <Button title = "Upload New Picture" onPress = {handleUpload} />
        {image && <Image source = {{ uri: image }} style = {styles.image} />}
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
              onPress={handleBack}>
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
}
