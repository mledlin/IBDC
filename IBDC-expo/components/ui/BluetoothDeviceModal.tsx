import React from "react";
import { Modal, View, Text, FlatList, Pressable, StyleSheet, } from "react-native";

type BluetoothDevice = {
     id: string;
    name: string;
     battery: number;
    storage: { used: number; total: number };
    firmwareVersion: string;
    lastSynced: string;
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
                            <Text style={styles.deviceName}>{item.name || "Unknown Device"}</Text>
                            <Text style={styles.deviceId}>{item.id}</Text>
                        </Pressable>
                    )}
                    />
                )}
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
            </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay:{
        flex: 1, 
        backgroundColor: "transparent", 
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#f8fafc",
        marginBottom: 10,
    },
    closeButton: {
        marginTop: 16,
        backgroundColor: "#dc2626",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    closeButtonText: {
        color: "white",
        fontWeight: "600",
    },
    deviceName: { 
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    deviceId: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
   
})