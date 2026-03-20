import React from "react";
import { Modal, View, Text, FlatList, Pressable, StyleSheet, } from "react-native";

type BluetoothDevice = {
    id: string; 
    name: string | null;
}

type BluetoothDeviceModalProps = {
    visible: boolean; 
    devices: BluetoothDevice[];
    onClose: () => void;
    onSelectDevice: (device: BluetoothDevice) => void;
}

export default function BluetoothDeviceModal({ visible, devices, onClose, onSelectDevice,}: BluetoothDeviceModalProps ){
    return (
        <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        >
            <View style={styles.overlay}>
            <View style={styles.container}>
                <Text style={styles.title}>Select IBDC Device</Text>
                {devices.length === 0 ? (
                    <Text style={styles.emptyText}>No Devices Found. Ensure Device is in pair mode.</Text>
                ) : (
                    <FlatList
                    data = {devices}
                    keyExtractor={(item)=> item.id}
                    renderItem={({ item }) => (
                        <Pressable
                        style={styles.deviceItem}
                        onPress={() => onSelectDevice(item)}
                        >
                            <Text> {item.name || "Unknown Device"}</Text>
                            <Text>{item.id}</Text>
                        </Pressable>
                    )}
                    />
                )}
                <Pressable onPress={onClose}>
                    <Text>Close</Text>
                </Pressable>
            </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay:{
        flex: 1, 
        backgroundColor: "black", 
        justifyContent: "center", 
        alignItems: "center",
        padding: 20,

    },
    container: {
        width: "100%", 
        maxHeight: "75%", 
        backgroundColor: "white", 
        borderRadius: 16, 
        padding: 20,

    },
    title: {
        fontSize: 20, 
        fontWeight: "700", 
        marginBottom: 16, 
        textAlign: "center",
    },
    emptyText: {
        textAlign: "center", 
        color: "grey",
        marginVertical: 20,
    },
    deviceItem: {
        paddingVertical: 14, 
        paddingHorizontal: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: "#e5e5e5",
    },
   
})