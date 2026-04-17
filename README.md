# Intelligent Bike Dash Cam (IBDC) Project

This application has been developed by 4 students at Arizona State University during the Summer 2026 semester. Further development is scheduled for Fall 2026. Their instructor and sponsor was Dr. Heinrich.

- Jair Franco
- Colin Tugend
- Matthew Edlin
- Christopher Paquin

## Index

1. What is this project?
2. Who is the Rob Dollar foundation
3. Core Requirements
4. Why Typescript / React / Expo
5. How to build / run
6. Current Status
7. Branch Status
8. Current Issues
9. Future Tasks

Appendix 1 - Expo Development Environment

## 1. What is this project?

This project is intended to pair with a physical device being developed at the University of Arizona that will be attached to a bicycle handle and monitor passing cars. The intent is to track cars that pass too close and are in violation of Arizona Law which states vehicles must provide cyclists with 3+ feet of clearance. The device, when detecting an offender, will attempt to photograph the license plate and transit details to this application via Bluetooth. This will allow the cyclist for focus on staying safe and automatically documenting the vehicle so the cyclist can inform the authorities. Law enforcement may be able to use the data to hold repeat offenders accountable. Law makers can use the data to identify roads that would be ideal for investment due to higher than normal numbers of incidents.

## 2. Who is the Rob Dollar foundation

From their website at https://www.robdollarfoundation.org/about-rob-dollar-foundation/our-mission

The Rob Dollar Foundation exists to improve cyclist safety across Arizona through education, awareness, and advocacy.​​Working with local officials, organizations, and community partners, the foundation supports initiatives designed to create safer roadways and strengthen protections for cyclists. The foundation’s efforts focus on increasing awareness of safe riding and driving practices while supporting policies and programs that improve conditions for cyclists at the city and state level.

## 3. Core Requirements

1. Use a shared Protobuf protocol to connect with the integrated device over Bluetooth.
2. Store Incidents from the device and allow supplemental data to be attached to support reporting.
3. Store data in a local embedded database.
4. Generate PDF reports.
5. Provide a seamless and intuitive user experience on both Android and IOS devices.

## 4. Why Typescript / React / Expo

Based on our research the recommended tech stack for mobile development on both platforms is React native, Typescript, and Expo. These technologies simplify app development a lot and allow a lot to be built with very minimal code. Javascript was possible but our team decided to go with Typescript due to its rapid growth in the industry and strong type safety additions.

Our first 4 sprints reinforced this being the right call as development was fast and easy to build a framework and there are many options to further refine the design as polish becomes more of a focus towards the end of the Fall work schedule.

## 5. How to build / run

You will need NPM installed on your computer to handle installing the dependencies that are saved in package.json which is located in the IBDC-Expo/ folder.

**Note** If you need to use Bluetooth or GPS for testing or running the application you MUST use an Expo development build. This means you need to build an apk file for Android or ipa file for IOS and load it on a physical phone or supported emulator rather than "streaming" it like expo-go normally allows. The steps to do this for any configuration are listed at the bottom of this README.

This will install any required dependencies that you don't have.

```Bash
npm install
```

You will need an android or IOS operating system to run this application. Either start an emulator now on your pc or have your phone ready. You may need to enable USB debugging (android)

For Android, you can open the Device Manager on Android Studio as one of many options; it works "out of the box".

This is how you will run the program (From the IBDC-Expo folder as it must be the same directory as package.json)

```Bash
npx expo start
```

For a physical device download the expo go app and use it to scan the QR code that will appear in your terminal.

Now select the menu option you wish. By default use:

- i - Find a running IOS emulator and load the app there.
- a - Find a running Android emulator  and load the app there.
- r - Restart the app

Note: Just saving code changes will often instantly refresh the app on your device or emulator.

In the event of any error:
- Stop everything
- Restart the emulator
- Restart expo

## 6. Current Status

The current version operates on both IOS and Android and has a functional User interface that meets with the approval of the sponsor. Navigation between screens works as does data flow from the database to the UI. The database is not yet optimized as it was just implemented and tested. The look and feel of the app has been implemented through themes in the settings menu. There are 2 options currently and more can be added easily for demonstration and customization.

## 7. Branch Status

There are 14 branches in the current project. Many have been merged into dev and remain as a branch just for grading purposes.

Main - The projects Main Branch. Only documents have been updated here. At the end of Sprint 4 in the Spring C Session we will merge a stable version to main from dev.
Dev - The primary repository for tested functional code.
US#56-Protobuf - Efforts to handle data transmitted via Protobuf are focused here.
All other branches have been merged to dev at this point.

Taiga Link to see Task history: https://tree.taiga.io/project/colintugend-asu-intelligent-bicycle-dash-cam/backlog

## 8. Current Issues

These are issues in the current code that need to be fixed.

- On IOS devices the top 1.5 inches of the screen are blocked preventing the user from seeing a logo or filtering options on some screens. This issue does not exist on Android and needs to be researched.
- The sponsor would like the transition from incomplete incident images to the edge of the scroll space should be blurred to make a softer transition that a sharp line.
- Displayed sessions on Session History screen needs to be connected to the settings screen toggle between display options. Right now its just a constant on the Session page.

## 9. Future Tasks

These are issues that have not yet been started but either need or should be added as part of the next development cycle.

UI:
- Add custom theme support.
- Add a donate button for the Rob Dollar foundation. (Not requested by Sponsor. Just an idea)
- UI Polish needed to appear more professional.
- Settings page needs to be updated with real settings such as image capture quantity.
- Ability to delete sessions, incidents or data by age must be added.
- Main Page placeholder image needs to be replaced.
- Add incident history storage size indication somewhere.
- Add deterministic mock data additions for testing purposes.

Database:
- The Database needs to be normalized.
- DAO must be created and optimized.
- Settings page options need to be hooked up to a configuration file or the database.
- Formal documentation of the schema should be done when optimized.

Network:
- Protobuf protocol code needs to be implemented and tested.
- Code to poll the device for unsent incidents must be created and tested.
- Device status information must be hooked up to the main page.

Other:
- Determine how the Google Maps api would work in a public application with the key being personal to a developer.
- Develop solution to export reports as PDF files.
- Create build task to produce apk, ipa files easily.
- Create an export image to phone option so that many images aren't flooding the users gallery but they can move images they choose if needed.
- Develop code to handle estimating time/location of incidents captured without connectivity. Alternatively allow for users to pick from a map and add a time.


## Appendix 1 - Expo Development Environment

Expo Development Build steps

1. Replace app.json with app_with_BLE.json for a ready to go plugin launcher.
2. Enter the following to download and install the expo dev client.

```Bash
npx expo install expo-dev-client
```

3. Enter the following to download and install the BLE library.

```Bash
npx expo install react-native-ble-plx
```

4. Build the app locally for whichever platform you wish:

Clean/Build equivalent

```Bash
npx expo prebuild --clean
```

Android

Emulator:

```Bash
npx expo run:android
```

Device:

```Bash
npx expo run:android --device
```

IOS

Emulator:

```Bash
npx expo run:ios
```

Device:

```Bash
npx expo run:ios --device
```

5. Run IDBC on either an emulator or physical device!

Ensure you request these permissions

Android 12+:
•             BLUETOOTH_SCAN
•             BLUETOOTH_CONNECT

Android <=11:
•             BLUETOOTH
•             BLUETOOTH_ADMIN
•             ACCESS_FINE_LOCATION

IOS
•             IOS automatically requests permissions because NSBluetoothAlwaysUsageDescription is present.

Code Example for requesting permissions

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
