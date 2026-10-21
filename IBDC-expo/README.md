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

The app uses native BLE and on-device TensorFlow Lite modules, so run it in an
Expo development build rather than Expo Go. The required dev-client, BLE,
TFLite, Nitro, and image-manipulation packages are declared in `package.json`.

1. From `IBDC-expo`, install project dependencies:

```Bash
npm install
```

2. The EfficientDet-Lite0 model is bundled at
`assets/models/efficientdet_lite0_float32_1.tflite`, and Metro is configured to
bundle `.tflite` assets. After changing native dependencies, rebuild the app:

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

3. Start Metro for the installed development client:

```Bash
npx expo start --dev-client
```

`npx expo run:android [--device]` builds and installs the Android development
app. iOS builds and device installation require macOS and Xcode.


### Offline vehicle detection

Incoming, fully assembled images are analyzed one at a time on-device with
`react-native-fast-tflite`. The bundled model is Google's MediaPipe
EfficientDet-Lite0 float32 COCO model, downloaded from the official model URL
linked by the [Google MediaPipe Object Detector guide](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector):

`https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite`

Its SHA-256 is
`40338edf5ec70d43e318b0a716a84d4564cd1802759a7a07170c7e43796dbf58`.
The model's embedded label map is reproduced in `services/COCOLabelMap.ts`
and the service resolves vehicle class indices from those label names.
The model also publishes this label map at
`https://storage.googleapis.com/mediapipe-tasks/object_detector/labelmap.txt`.
The float32 input tensor is `[1, 320, 320, 3]`, RGB, normalized per channel as
`(pixel - 127.5) / 127.5`. Images are orientation-corrected, resized to fit,
center-padded to 320×320, and mapped back to original-image pixel coordinates.
The two float32 output tensors are the 19,206×90 class scores and 19,206×4
encoded box locations. Anchors, box decoding, and class-aware non-maximum
suppression use min/max levels 3/7, three scales, anchor scale 4, aspect ratios
`[1:1, 1.4:0.7, 0.7:1.4]`, box scales `[10, 10, 5, 5]`, and a 0.5 IoU limit.

The analysis threshold defaults to 0.5. Analysis state and detections are
stored on each `incident_images` row. Existing rows remain `not_scheduled`
until deliberately scheduled; the app does not backfill historical photos.
Pending work and interrupted processing are recovered at startup. Failed
analysis can be retried from the Choose Photo card.


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

# How to use mock data!

- Mock data is stored in /domain/mockData.ts
- The following are the available mock data structures.

  1. defaultSession - 1 single session with 2 incidents.
  2. defaultIncident - 1 single incident
  3. fullMockHistory - 18 sessions with incidents in all stages
  4. emptyMockSessions - 18 sessions with no incidents


- Use this line:
```Typescript
import {SOMETHING} from "@/domain/mockData"
```
- Instead of "SOMETHING", type the variable you want based on the data you want.
- Use the variable however you wish. Review RideDetails.tsx for a real example.
- Let me know if you have any questions!