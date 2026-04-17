import { StyleSheet, View, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

type Pin = {
id: string; 
title: string;
latitude: number; 
longitude: number;
};

type Props = {
    initialRegion: Region;
    pins?: Pin[];
}
export default function MapScreen({initialRegion, pins =[]}: Props) { 
    //Use Google Maps for Android
    //Use default provider (apple maps), for iOS
    const provider = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;
    return (
        <View style={styles.container}>
            <MapView style={styles.map} provider={provider} initialRegion={initialRegion}>
                {pins.map((pin) => (
                  <Marker
                    key={pin.id}
                    coordinate={{
                    latitude: pin.latitude,
                    longitude: pin.longitude,
                  }}
                  title={pin.title}
                  />
                ))}
                
            </MapView>
        </View>
    );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});