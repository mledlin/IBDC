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

# Program Structure

This application uses expo-router for navigation. App.tsx controls the first screen shown.

## app/(tabs)

This is where all the screens live. Currently, there is a MainScreen and a Settings screen that are extremely basic. They have a simple text link to move between pages.

