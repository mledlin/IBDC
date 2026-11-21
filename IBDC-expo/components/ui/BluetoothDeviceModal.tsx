import React, {useState} from "react";
import {Modal, View, Text, FlatList, Pressable, StyleSheet, TextInput} from "react-native";
import {BleDeviceInfo} from "@/ble/BleAdapter";
import useSavedDeviceNames  from "@/hooks/useSavedDeviceNames"

type BluetoothDeviceModalProps = {
    visible: boolean; 
    devices: BleDeviceInfo[];
    onClose: () => void;
    onSelectDevice: (device: BleDeviceInfo) => void;
}

const SAVED_DEVICE_NAMES_KEY: string = "key-1";

export default function BluetoothDeviceModal({ visible, devices, onClose, onSelectDevice,}: BluetoothDeviceModalProps ){
    const {savedDevices, saveDeviceName, isLoading, error} = useSavedDeviceNames(SAVED_DEVICE_NAMES_KEY);

    const [editingDeviceId, setEditingDeviceId] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<BleDeviceInfo | null>(null);

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
                        <Text style={styles.emptyText}>
                            No Devices Found. Ensure Device is in pair mode.
                        </Text>
                    ) : (
                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View>
                                    <Pressable
                                        style={styles.deviceItem}
                                        onPress={() => onSelectDevice(item)}
                                    >
                                        <Text style={styles.deviceName}>
                                            {savedDevices.find(
                                                saved => saved.id === item.id
                                            )?.name ?? item.id}
                                        </Text>
                                        <Text style={styles.deviceId}>
                                            {item.id}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={styles.renameButton}
                                        onPress={() => {
                                            setSelectedDevice(item);
                                            setEditingDeviceId(true);
                                        }}
                                    >
                                        <Text>Set device name</Text>
                                    </Pressable>
                                </View>
                            )}
                        />
                    )}

                    <Pressable
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>

                {editingDeviceId && selectedDevice && (
                    <View style={styles.renameOverlay}>
                        <View style={styles.renameContainer}>
                            <Text>Enter device name</Text>

                            <TextInput
                                style={styles.renameInput}
                                placeholder="Enter device name"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={async (event) => {
                                    await saveDeviceName(
                                        selectedDevice.id,
                                        event.nativeEvent.text
                                    );

                                    setEditingDeviceId(false);
                                    setSelectedDevice(null);
                                }}
                            />

                            <Pressable
                                onPress={() => {
                                    setEditingDeviceId(false);
                                    setSelectedDevice(null);
                                }}
                            >
                                <Text>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay:{
        flex: 1, 
        backgroundColor: "rgba(0,0,0,0.5)", 
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
    renameButton: {
        paddingVertical: 3,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#808080',
        fontSize: 12,
        alignSelf: "flex-start",
        backgroundColor: "#e5e7eb",
        borderCurve: "continuous",
        borderRadius: 14,
    },
    renameOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    renameContainer: {
        backgroundColor: "white",
        padding: 24,
        borderRadius: 12,
        width: "85%",
        gap: 16,
    },
    renameInput: {
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 8,
        padding: 12,
    },

})