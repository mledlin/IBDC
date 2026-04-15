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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@/context/ThemeContext";
import { getIncidentById, getIncidentImagesByIncidentId, getMockImageSource, updateIncidentDetails } from "./database";
// NOTES:
// You will need to run npm install to get new dependencies here.
// TODO Screen should move up when on-screen keyboard appears but doesnt yet.
// TODO Image not hooked up yet
// TODO Lat/Long should be replaced with a Google Maps I think.

// work in progress
export default function IncidentDetail() {
  const router = useRouter();
  const {theme} = useTheme();
   const { id, session_id, latitude, longitude, license_plate, created_time, best_image_id, image_path} = useLocalSearchParams();
  const [injurySeverity, setInjurySeverity] = useState("None");
  const [driverPresent, setDriverPresent] = useState(false);
  const [driverInfo, setDriverInfo] = useState("");
  const [extraComments, setExtraComments] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [licensePlateInput, setLicensePlateInput] = useState(
        typeof license_plate === "string" ? license_plate : ""
    );
  //Mock image, we can pass the same image once db is in and we can reliably retrieve image paths
  const [bestImageId, setBestImageId] = useState<string | null> (null);
  const [thumbnailSource, setThumbnailSource] = useState(
    require("@/assets/images/example.jpg")
  );
  //Update Helper
  async function saveIncidentField(updates: {
        license_plate?: string | null;
        injury_severity?: string | null;
        driver_present?: number;
        driver_information?: string | null;
        extra_comment?: string | null;
        vehicle_make?: string | null;
        vehicle_model?: string | null;
        vehicle_color?: string | null;
        vehicle_year?: string | null;
  }) {
    try {
        if (typeof id !== "string")
            return;
        await updateIncidentDetails(id, updates);
    } catch(error){
        console.error("Failed to update incident", error);
    }
  }
 
    useFocusEffect(
  React.useCallback(() => {
    async function loadIncidentData() {
    try{
      if (typeof id !== "string")
        return;
      const incident: any = await getIncidentById(id);
      const images: any[] = await getIncidentImagesByIncidentId(id);

      setBestImageId(incident?.best_image_id ?? null);
      setLicensePlateInput(incident?.license_plate ?? "");
      setInjurySeverity(incident?.injury_severity ?? "None");
      setDriverPresent(Boolean(incident?.driver_present));
      setDriverInfo(incident?.driver_information ?? "");
      setExtraComments(incident?.extra_comment ?? "");
      setVehicleMake(incident?.vehicle_make ?? "");
      setVehicleModel(incident?.vehicle_model ?? "");
      setVehicleColor(incident?.vehicle_color ?? "");
      setVehicleYear(incident?.vehicle_year ?? "");

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
    loadIncidentData();
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
                    onChangeText={(text) => {
                        setLicensePlateInput(text);
                        void saveIncidentField({license_plate: text});
                    }}
                    placeholder="Enter license plate"/>

                <Text style={styles.inputLabel}>Injury Severity</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={injurySeverity}
                        onValueChange={(itemValue) => {
                            setInjurySeverity(itemValue);
                            void saveIncidentField({ injury_severity: itemValue});
                        }}
                        >
                        <Picker.Item label="None" value="None" />
                        <Picker.Item label="Minor" value="Minor" />
                        <Picker.Item label="Moderate" value="Moderate" />
                        <Picker.Item label="Severe" value="Severe" />
                    </Picker>
                </View>

                <View style={styles.checkboxRow}>
                    <Checkbox value={driverPresent} onValueChange={ (value) => {
                        setDriverPresent(value);
                        void saveIncidentField({driver_present: value ? 1 : 0});
                    }} />
                    <Text style={styles.checkboxLabel}>Driver Present</Text>
                </View>

                <Text style={styles.inputLabel}>Driver Information</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={driverInfo}
                    onChangeText={(text) => {
                        setDriverInfo(text);
                        void saveIncidentField({driver_information: text});
                    }}
                    placeholder="Enter driver information"
                    multiline />

                <Text style={styles.inputLabel}>Extra Comments</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={extraComments}
                    onChangeText={(text) => {
                        setExtraComments(text);
                        void saveIncidentField({extra_comment: text});
                    }}
                    placeholder="Enter extra comments"
                    multiline />

                <Text style={styles.inputLabel}>Vehicle Make</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleMake}
                    onChangeText={(text) => {
                        setVehicleMake(text);
                        void saveIncidentField({vehicle_make: text});
                    }}
                    placeholder="Enter vehicle make" />

                <Text style={styles.inputLabel}>Vehicle Model</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleModel}
                      onChangeText={(text) => {
                        setVehicleModel(text);
                        void saveIncidentField({vehicle_model: text});
                    }}
                    placeholder="Enter vehicle model" />

                <Text style={styles.inputLabel}>Vehicle Color</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleColor}
                    onChangeText={(text) => {
                        setVehicleColor(text);
                        void saveIncidentField({vehicle_color: text});
                    }}
                    placeholder="Enter vehicle color" />

                <Text style={styles.inputLabel}>Vehicle year</Text>
                <TextInput
                    style={styles.input}
                    value={vehicleYear}
                    onChangeText={(text) => {
                        setVehicleYear(text);
                        void saveIncidentField({vehicle_year: text});
                    }}
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