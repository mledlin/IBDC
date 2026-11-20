// This hook should set and retrieve device names from storage.
import { useAsyncStorage } from "./useAsyncStorage";
import { useCallback } from 'react';
import { BleDeviceInfo } from "@/ble/BleAdapter";

export default function useSavedDeviceNames(key: string) {
    const {data, error, isLoading, setValue} = useAsyncStorage(key);

    const savedDevices: BleDeviceInfo[] = JSON.parse(data ?? "[]") as BleDeviceInfo[];

    const saveDeviceName = useCallback(
        async (uuid: string, name: string) => {

            // Search existing devices to see if it already exists
            const existingDevice = savedDevices.find(
                device => device.id === uuid
            );

            // Need to create a new BleDeviceInfo[] to trigger re-render
            let updatedDevices: BleDeviceInfo[];


            if (existingDevice) { // Add the updated name to updatedDevices and copy saved contents into it
                updatedDevices = savedDevices.map(device =>
                    device.id === uuid
                        ? { ...device, name }
                        : device
                );
            } else { // Add the new device to the existing array and copy saved contents into the it
                updatedDevices = [
                    ...savedDevices,
                    { id: uuid, name }
                ];
            }
            await setValue(updatedDevices);
        },
        [savedDevices, setValue]
    );

    return {
        savedDevices,
        saveDeviceName,
        isLoading,
        error
    };

}



