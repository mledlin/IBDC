import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@/context/ThemeContext";

// NOTES:
// You will need to run npm install to get new dependencies here.
// TODO Screen should move up when on-screen keyboard appears but doesnt yet.
// TODO Image not hooked up yet
// TODO Lat/Long should be replaced with a Google Maps I think.

// work in progress

export default function IncidentDetail() {
    const router = useRouter();
    const { theme } = useTheme();

    // I dont understand how this 'useLocalSearchParams' works or how its supposed to work.
    // Leaving it alone for now.
    const { id, session_id, lat, long, license_plate, created_time, best_image_id } =
        useLocalSearchParams();

    const thumbnailSource = require("@/assets/images/example.jpg");

    const [licensePlateInput, setLicensePlateInput] = useState(
        typeof license_plate === "string" ? license_plate : ""
    );

    const [injurySeverity, setInjurySeverity] = useState("None");
    const [driverPresent, setDriverPresent] = useState(false);
    const [driverInfo, setDriverInfo] = useState("");
    const [extraComments, setExtraComments] = useState("");
    const [vehicleMake, setVehicleMake] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [vehicleYear, setVehicleYear] = useState("");

    function openChoosePhoto() {
        router.push("/ChoosePhoto");
    }

    const createdTimeText =
        typeof created_time === "string" && created_time.trim().length > 0 ? created_time : "Unknown date/Time";


    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background },]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Incident Details</Text>
            <Text style={[styles.createdTime, { color: theme.colors.text }]}>{createdTimeText}</Text>

            <View style={[styles.thumbnailContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },]}>
                <Image
                    source={thumbnailSource}
                    style={styles.thumbnail}
                    resizeMode="cover"/>
            </View>

            <View style={[styles.detailsBox, { borderColor: theme.colors.border , backgroundColor: theme.colors.surface, },]}>
                <View style={styles.coordinatesRow}>
                    <View style={styles.coordinateItem}>
                        <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>Latitude</Text>
                        <Text style={[styles.detailsValue, { color: theme.colors.textSecondary }]}>{lat || "No Latitude"}</Text>
                    </View>

                    <View style={styles.coordinateItem}>
                        <Text style={[styles.detailsLabel, { color: theme.colors.textSecondary }]}>Longitude</Text>
                        <Text style={[styles.detailsValue, { color: theme.colors.textSecondary }]}>{long || "No Longitude"}</Text>
                    </View>
                </View>
import React, {useState} from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import { getIncidentById, getIncidentImagesByIncidentId, getMockImageSource } from "./database";

export default function IncidentDetail() {
  const router = useRouter();
  const { id, session_id, latitude, longitude, license_plate, created_time, best_image_id, image_path} = useLocalSearchParams();
  //Mock image, we can pass the same image once db is in and we can reliably retrieve image paths
  const [bestImageId, setBestImageId] = useState<string | null> (null);
  const [thumbnailSource, setThumbnailSource] = useState(
    require("@/assets/images/example.jpg")
  );
 
useFocusEffect(
  React.useCallback(() => {
    async function loadIncidentImage() {
    try{
      if (typeof id !== "string")
        return;
      const incident: any = await getIncidentById(id);
      const images: any[] = await getIncidentImagesByIncidentId(id);

      setBestImageId(incident?.best_image_id ?? null);

      const selectedImage = images.find(
        (image: any) => image.id === incident?.best_image_id
      );

      if (selectedImage?.file_path) {
        const source = getMockImageSource(selectedImage.file_path);
        if (source) {
          setThumbnailSource(source);
        }
      }
    } catch (error) {
      console.error("Failed to load thumbnail" , error);
    }
  }
    loadIncidentImage();
  }, [id])
);
  function openChoosePhoto(){
    router.push({
      pathname: "/ChoosePhoto",
      params: {
        incident_id: id,
      },
    });
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

            <View style={[styles.formSection, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },]}>
                <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary } ]}>Additional Details</Text>

                <Text style={styles.inputLabel}>License Plate</Text>
                <TextInput
                    style={[styles.input]}
                    value={licensePlateInput}
                    onChangeText={setLicensePlateInput}
                    placeholder="Enter license plate"/>

                <Text style={styles.inputLabel}>Injury Severity</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={injurySeverity}
                        onValueChange={(itemValue) => setInjurySeverity(itemValue)}>
                        <Picker.Item label="None" value="None" />
                        <Picker.Item label="Minor" value="Minor" />
                        <Picker.Item label="Moderate" value="Moderate" />
                        <Picker.Item label="Severe" value="Severe" />
                    </Picker>
                </View>

                <View style={styles.checkboxRow}>
                    <Checkbox value={driverPresent} onValueChange={setDriverPresent} />
                    <Text style={styles.checkboxLabel}>Driver Present</Text>
                </View>

                <Text style={styles.inputLabel}>Driver Information</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={driverInfo}
                    onChangeText={setDriverInfo}
                    placeholder="Enter driver information"
                    multiline />

                <Text style={styles.inputLabel}>Extra Comments</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={extraComments}
                    onChangeText={setExtraComments}
                    placeholder="Enter extra comments"
                    multiline />

                <Text style={styles.inputLabel}>Vehicle Make</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleMake}
                    onChangeText={setVehicleMake}
                    placeholder="Enter vehicle make" />

                <Text style={styles.inputLabel}>Vehicle Model</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Enter vehicle model" />

                <Text style={styles.inputLabel}>Vehicle Color</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="Enter vehicle color" />

                <Text style={styles.inputLabel}>Vehicle year</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleYear}
                    onChangeText={setVehicleYear}
                    placeholder="Enter vehicle year"
                    keyboardType="numeric" />
            </View>

            <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.colors.primary }]} onPress={openChoosePhoto}>
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
        marginBottom: 4,
        textAlign: "center",
    },
    createdTime: {
        fontSize: 18,
        marginBottom: 16,
        textAlign: "center",
    },
    detailsBox: {
        borderWidth: 2,
        borderColor: "#000000",
        borderRadius: 8,
        padding: 24,
        marginBottom: 20,
    },
    coordinatesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    coordinateItem: {
        flex: 1,
    },
    detailsLabel: {
        fontSize: 18,
        color: "#000",
        marginTop: 8,
    },
    detailsValue: {
        fontSize: 18,
        color: "#000",
        marginTop: 2,
    },
    formSection: {
        borderWidth: 2,
        borderColor: "#000000",
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#999999",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: "#ffffff",
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#999999",
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: "#ffffff",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 8,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
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
});