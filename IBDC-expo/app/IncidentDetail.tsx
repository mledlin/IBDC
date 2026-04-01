import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { useLocalSearchParams, useRouter} from "expo-router";

export default function IncidentDetail() {
  const router = useRouter();
  const { id, session_id, lat, long, license_plate, created_time, best_image_id } = useLocalSearchParams();
  //Mock image 
  const thumbnailSource = require("@/assets/images/example.jpg")
  const incidentImages = [
    { id: "1", file_path: "image_1.jpg"},
    { id: "2", file_path: "image_2.jpg"},
    { id: "3", file_path: "image_3.jpg"},
  ];
  function openChoosePhoto(){
    router.push("/ChoosePhoto");
  }
  return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style = {styles.title}>Incident Details</Text>
            <View style = {styles.thumbnailContainer}>
              <Image 
                source = {thumbnailSource} //This will eventually beocome uri: image.file_path when DB is in
                style = {styles.thumbnail}
                resizeMode = "cover"
                ></Image>
            </View>
            <View style={styles.detailsBox}>
                <Text style = {styles.detailsLabel}>Incident ID</Text>
                <Text style = {styles.detailsValue}>{id || "No ID"}</Text>

                <Text style = {styles.detailsLabel}>Session ID</Text>
                <Text style = {styles.detailsValue}>{session_id || "No Session ID"}</Text>

                <Text style = {styles.detailsLabel}>Created Time</Text>
                <Text style = {styles.detailsValue}>{created_time || "No Time Found"}</Text>

                <Text style = {styles.detailsLabel}>Latitude</Text>
                <Text style = {styles.detailsValue}>{lat || "No Latitude"}</Text>

                <Text style = {styles.detailsLabel}>Longitude</Text>
                <Text style = {styles.detailsValue}>{long || "No Longitude"}</Text>

                <Text style = {styles.detailsLabel}>License Plate</Text>
                <Text style = {styles.detailsValue}>{license_plate || "No License Plate"}</Text>

                <Text style = {styles.detailsLabel}>Best Image ID</Text>
                <Text style = {styles.detailsValue}>{best_image_id || "No Best Image Selected"}</Text>
            </View>

            <TouchableOpacity style={styles.photoButton} onPress={openChoosePhoto}>
                <Text style={styles.photoButtonText}>Choose Best Photo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
  thumbnailContainer: {
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "center",
  },

  thumbnail: {
    width: 380,
    height: 280,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailsBox: {
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 8,
    padding: 24,
    marginBottom: 20,
  },
  detailsLabel: {
    fontSize: 18,
    color: "#000",
  },
  detailsValue: {
    fontSize: 18,
    color: "#000",
    marginTop: 2,
    paddingLeft: 40
  },

  photoButton: {
    backgroundColor: "#0000ff",
    padding: 14,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: "center",

  },

  photoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 28,
    marginBottom: 212,
  },
  imageBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    marginBottom: 24,
  },
   imageRow: {
    padding: 14, 
    borderBottomWidth: 1,
  },
  imageText: {
    fontSize: 16,
    color: "#000000",
  },
  button: {
    padding: 20,
    backgroundColor: "blue", 
    marginBottom: 15, 
    borderRadius: 10,
  }
});