# Welcome to the Intelligent Bicycle Dash Cam

## Get started / Running the App

1. Install dependencies

```bash
npm install
```

2. Start the app

You will need an android or IOS operating system to run this application. Either start an emulator now on your pc or 
have your phone ready. You may need to enable USB debugging (android)

For Android, you can open the Device Manager on Android Studio as one of many options; it works "out of the box".

For a physical device download the expo go app and use it to scan the QR code that will appear in your terminal.

```bash
npx expo start
```

Now select the menu option you wish.

In the event of any error: 
   - Stop everything
   - Restart the emulator
   - Restart expo

--------------

## Expo Development Build steps

 - Replace `app.json` with `app_with_BLE.json` for a ready to go plugin launcher.

1. Enter the following to download and install the expo dev client.
```Bash
npx expo install expo-dev-client
```
2. Enter the following to download and install the BLE library.
```Bash
npx expo install react-native-ble-plx
```

3. Build the app locally for whichever platform you wish:

#### Clean/Build equivalent

```Bash
npx expo prebuild --clean
```

#### Android
```Bash
Emulator:
npx expo run:android

Device:
npx expo run:android --device
```
#### IOS
```Bash
Emulator:
npx expo run:ios

Device:
npx expo run:ios --device
```

4. Run IDBC on either an emulator or physical device!


### Ensure we are requesting these permissions
#### Android 12+:
- BLUETOOTH_SCAN
- BLUETOOTH_CONNECT
#### Android <=11:
- BLUETOOTH
- BLUETOOTH_ADMIN
- ACCESS_FINE_LOCATION
#### IOS
- IOS automatically requests permissions because `NSBluetoothAlwaysUsageDescription` is present.

### Code Example for requesting permissions

The following is a code snippet that should request permissions based on the OS its running on. 

```Typescript
import { Platform, PermissionsAndroid } from 'react-native';

export async function requestBlePermissions() {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.Version >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
```
Note: Android manifest and IOS Info.plist files are not required as app.json covers them completely.

# Program Structure

This application uses expo-router for navigation. App.tsx controls the first screen shown.

## app/(tabs)

This is where all the screens live. Currently, there is a MainScreen and a Settings screen that are extremely basic. They have a simple text link to move between pages.

