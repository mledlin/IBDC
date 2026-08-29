/**
 * PermissionsHandler.ts
 * This class will be used as a single point where permissions can be requested. This is a utility class sp I think all
 * methods are going to be public static.
 */
import {Platform} from 'react-native';
import {PermissionsAndroid} from "react-native";
// 1. Request permissions for Bluetooth and Location Services

// 2. Export an object that contains all the necessary data for requesting permissions



//Private functions ----------------------------------------------------------------------------------------------------

// This code was found here -> https://dotintent.github.io/react-native-ble-plx/#getting-started
const requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') {
        return true
    }
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









