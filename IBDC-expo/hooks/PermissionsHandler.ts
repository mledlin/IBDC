/**
 * PermissionsHandler.ts
 * This class will be used as a single point where permissions can be requested. This is a utility class sp I think all
 * methods are going to be public static.
 */
import {Platform, PermissionsAndroid} from 'react-native';

// 1. Request permissions for Bluetooth (✓) and Location Services(ⅹ)

// 2. Export an object that contains all the necessary data for verifying and requesting permissions



//Public functions ----------------------------------------------------------------------------------------------------



// This code was found here at https://dotintent.github.io/react-native-ble-plx/#getting-started.
/**
 * requestBluetoothPermissions
 * Parameters: none
 * returns: a promise where on success a boolean value of true is returned
 */
export async function requestBluetoothPermissions() {

    // Permission automatically granted on iOS if 'NSBluetoothAlwaysUsageDescription' is declared in the infoPlist file.
    // A prompt asking the user for permission should automatically pop up when scanning begins.
    if (Platform.OS === 'ios') {
        return true
    }

    // Android requires extra queries to guarantee
    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        const apiLevel = parseInt(Platform.Version.toString(), 10)

        if (apiLevel < 31) {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            return granted === PermissionsAndroid.RESULTS.GRANTED
        }
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ])

            return (
                result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
            )
        }
    }
    console.log("Permissions were not granted")
    return false
}


/*
export async function requestLocationServices(): Promise<boolean> {
    // Like bluetooth, depending on device and OS, the protocol for accessing location information may vary.
}
 */

















