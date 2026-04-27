import { router, useLocalSearchParams} from "expo-router";
import { useState } from "react";
import { updateIncidentBestImage } from "@/database/IncidentDao";
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
const{ width} = Dimensions.get("window");
const CARD_WIDTH = width * 0.78;
const SIDE_SPACING = 16;
const Item_SPACING = 12;
const SNAP_INTERVAL = CARD_WIDTH + SIDE_SPACING;
  

export default function ChoosePhoto() {
const {incident_id } = useLocalSearchParams();
 const { theme } = useTheme();
 const card_fit = width - 40;
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
      <View style={[styles.container, { backgroundColor: theme.colors.background },]}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border },]}>
        <Text style={[styles.eyebrow, { color: theme.colors.primaryForeground }]}>Incident: License Plate</Text>
        <Text style={[styles.title, { color: theme.colors.primaryForeground }]}>Choose the best Photo</Text>
        <Text style={[styles.subtitle, { color: theme.colors.primaryForeground }]}>Swipe through the available Images and tap the one you want to keep.</Text>
        </View>
        <FlatList
          data={photoList}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={()=> <View style={{width: Item_SPACING}} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
              styles.card,
              {width: CARD_WIDTH,backgroundColor: theme.colors.surface,borderColor: theme.colors.border,},]}
            onPress={ () => {
              void handleSelectPhoto(item.id)}}
            activeOpacity={0.92}>
            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="cover"/>
              <View style={[styles.photoCountBadge,{ backgroundColor: theme.colors.primary }, ]}>
                <Text style={[styles.photoCountText,{ color: theme.colors.primaryForeground },]}> 
                  {index + 1} / {photoList.length}
                </Text>
              </View>
            </View>
            <View style={[ styles.cardFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, }, ]} >
              <View>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}> {item.title} </Text>
                <Text style={[ styles.itemSubtitle, { color: theme.colors.textSecondary }, ]} > Tap to use this image </Text>
              </View>
              <View style={[ styles.pickBadge, { backgroundColor: theme.colors.primary }, ]} >
                <Ionicons name="checkmark-outline" size={16} color={theme.colors.primaryForeground}/>
                <Text style={[ styles.pickBadgeText, { color: theme.colors.primaryForeground },]} > Select </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.hintRow}>
        <Ionicons
          name="swap-horizontal-outline"
          size={16}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
          Swipe to see more photos
        </Text>
      </View>
    </View>
  );
}
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 28,
    },
    headerCard: {
      marginHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    },
    eyebrow: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    list: {
      paddingLeft: SIDE_SPACING,
      paddingRight: SIDE_SPACING,
      paddingBottom: 18,
    },
    itemText: {
      fontSize: 18,
      color: "black",
    },
    itemTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 2,
    },
    itemSubtitle: { 
      fontSize: 13,
      fontWeight: "500",
    },
    card: {
      borderWidth: 1,
      borderRadius: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 5,
      },
      image: {
        width: "100%",
        height: 360,
      },
      imageWrap: {
        position: "relative",
      },
      photoCountBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
      },
      photoCountText: {
        fontSize: 12,
        fontWeight: "700",
      },
      cardFooter: {
        borderTopWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      photocountBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
      },
      ItemTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 2,
      },
      pickBadge: {
        flexDirection: "row",
        alignItems: "center", 
        gap: 6,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
      },
      pickBadgeText: {
        fontSize: 13,
        fontWeight: "700",
      },
      hintRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 4,
      },
      hintText: {
        fontSize: 13,
        fontWeight: "500",
      },
  });
  