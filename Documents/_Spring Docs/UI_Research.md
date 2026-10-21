# Expo UI, Assets, and Basic Components Guide

This guide covers common setup patterns in an Expo app, including splash screens, app icons, checkboxes, images, and keeping the screen awake.

---

## 1. Splash screen

A splash screen is the image shown while your app is loading.

### Steps

1. Create a **1024 × 1024** image.
2. Use a **`.png`** file.
3. Use a **transparent background** in the image itself.
4. Save the file in **`assets/images`**.
5. Open your Expo app config file:
   - `app.json`, or
   - `app.config.js` / `app.config.ts`
6. Add the splash screen plugin under `expo.plugins`.

### Example

```json
{
  "expo": {
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#232323",
          "image": "./assets/images/splash-icon.png",
          "dark": {
            "image": "./assets/images/splash-icon-dark.png",
            "backgroundColor": "#000000"
          },
          "imageWidth": 200
        }
      ]
    ]
  }
}
```

### Notes

- `backgroundColor` sets the screen color behind the image.
- `imageWidth` controls how large the splash image appears.
- The `dark` section lets you use a different image and background color for dark mode.

---

## 2. App icon

The app icon is what users see on their device home screen.

### Steps

1. Use a **`.png`** file.
2. Save it in **`assets/images`**.
3. Open the Expo app config file.
4. Add the path as the value for `icon`.

### Example

```json
{
  "expo": {
    "icon": "./assets/images/icon.png"
  }
}
```

### Notes

- Use a square image.
- Keep the design simple and readable at small sizes.

---

## 3. Checkbox

Checkboxes are useful in settings screens, confirmation rows, and simple forms.

### Install

```bash
npx expo install expo-checkbox
```

### Import

```tsx
import Checkbox from 'expo-checkbox';
```

### Basic example

```tsx
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [isChecked, setChecked] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Checkbox
          style={styles.checkbox}
          value={isChecked}
          onValueChange={setChecked}
        />
        <Text style={styles.paragraph}>Normal checkbox</Text>
      </View>

      <View style={styles.section}>
        <Checkbox
          style={styles.checkbox}
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? '#4630EB' : undefined}
        />
        <Text style={styles.paragraph}>Custom colored checkbox</Text>
      </View>

      <View style={styles.section}>
        <Checkbox
          style={styles.checkbox}
          disabled
          value={isChecked}
          onValueChange={setChecked}
        />
        <Text style={styles.paragraph}>Disabled checkbox</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 32,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 15,
  },
  checkbox: {
    margin: 8,
  },
});
```

### Common props

- `value` — current checked state
- `onValueChange` — runs when the user toggles the checkbox
- `color` — custom checkbox color
- `disabled` — disables interaction

---

## 4. Images with `expo-image`

The `expo-image` package gives you better image handling than the default React Native image in many cases.

### Install

```bash
npx expo install expo-image
```

### Import

```tsx
import { Image } from 'expo-image';
```

### Example

```tsx
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image
        source="https://picsum.photos/300/200"
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 200,
  },
});
```

### Common props

#### `cachePolicy`
Controls whether the image is cached and where.

Options:
- `'none'`
- `'disk'`
- `'memory'`
- `'memory-disk'`

#### `contentFit`
Controls how the image fits inside its container.

Options:
- `'cover'`
- `'contain'`
- `'fill'`
- `'none'`
- `'scale-down'`

#### `placeholder`
Displays a temporary image or placeholder while the real image loads.

---

## 5. Keep the screen awake

This is useful for navigation screens, timers, scanning pages, or any screen where sleep would interrupt the user.

### Install

```bash
npx expo install expo-keep-awake
```

### Import

```tsx
import { useKeepAwake } from 'expo-keep-awake';
```

### Example

```tsx
import { useKeepAwake } from 'expo-keep-awake';
import { View, Text } from 'react-native';

export default function App() {
  useKeepAwake();

  return (
    <View>
      <Text>The screen will stay awake.</Text>
    </View>
  );
}
```

### Note

Call `useKeepAwake()` inside the component and before the `return` statement.

---

## 6. Buttons

Buttons trigger actions such as navigation, saving data, or submitting forms.

### Import

```tsx
import { Button } from 'react-native';
```

### Example

```tsx
import { Button, View } from 'react-native';

export default function App() {
  return (
    <View>
      <Button
        title="Press Me"
        onPress={() => console.log('Button pressed')}
      />
    </View>
  );
}
```

### Common props

- `title` — text displayed on the button
- `onPress` — function called when the button is pressed
- `disabled` — disables interaction

For more control over styling, developers often use `Pressable` instead of `Button`.

---

## 7. Text inputs

Text inputs allow users to type information such as names, passwords, or search queries.

### Import

```tsx
import { TextInput } from 'react-native';
```

### Example

```tsx
import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function App() {
  const [text, setText] = useState('');

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Enter text"
        value={text}
        onChangeText={setText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    padding: 10,
    margin: 10,
  },
});
```

### Useful props

- `placeholder` — hint text
- `value` — current input value
- `onChangeText` — callback when text changes
- `secureTextEntry` — hides text (password fields)

---

## 8. Switches

Switches represent on/off settings.

### Import

```tsx
import { Switch } from 'react-native';
```

### Example

```tsx
import { useState } from 'react';
import { View, Switch } from 'react-native';

export default function App() {
  const [enabled, setEnabled] = useState(false);

  return (
    <View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
      />
    </View>
  );
}
```

### Common props

- `value` — current switch state
- `onValueChange` — callback when toggled
- `disabled` — disables interaction

---

## 9. ScrollView

`ScrollView` allows content to scroll vertically or horizontally when it exceeds screen size.

### Import

```tsx
import { ScrollView } from 'react-native';
```

### Example

```tsx
import { ScrollView, Text } from 'react-native';

export default function App() {
  return (
    <ScrollView>
      <Text>Item 1</Text>
      <Text>Item 2</Text>
      <Text>Item 3</Text>
      <Text>Item 4</Text>
    </ScrollView>
  );
}
```

Use `ScrollView` when the list is small. For large lists, use `FlatList`.

---

## 10. FlatList

`FlatList` efficiently renders large lists of data.

### Import

```tsx
import { FlatList } from 'react-native';
```

### Example

```tsx
import { FlatList, Text } from 'react-native';

const DATA = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
  { id: '3', title: 'Item 3' }
];

export default function App() {
  return (
    <FlatList
      data={DATA}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.title}</Text>}
    />
  );
}
```

---

## 11. Navigation with Expo Router

Expo Router is the standard navigation system used in modern Expo apps.

### Folder structure example

```
app/

index.tsx
settings.tsx
history.tsx
```

Each file automatically becomes a screen.

### Navigating between screens

```tsx
import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View>
      <Link href="/settings">Go to Settings</Link>
    </View>
  );
}
```

---

## 12. Tabs vs Stack navigation

### Stack navigation

Screens are pushed on top of each other like pages.

Example flow:

```
Home → Details → Settings
```

Users can navigate back.

### Tabs navigation

Tabs allow switching between major sections of the app.

Example:

```
Home | History | Settings
```

Tabs stay visible at the bottom.

---

## 13. Modals

A modal is a screen that appears above the current screen.

### Example

```tsx
import { Modal, View, Text, Button } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Button title="Open Modal" onPress={() => setVisible(true)} />

      <Modal visible={visible} animationType="slide">
        <View>
          <Text>This is a modal</Text>
          <Button title="Close" onPress={() => setVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}
```

---

## 14. Styling with StyleSheet

React Native uses `StyleSheet` for component styling.

### Example

```tsx
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 20
  }
});
```

---

## 15. Using local images

Images stored inside the project can be imported directly.

### Example

```tsx
import { Image } from 'expo-image';

<Image
  source={require('../assets/images/icon.png')}
  style={{ width: 100, height: 100 }}
/>
```

---

## 16. Settings screen example

Settings screens typically contain switches, checkboxes, and navigation options.

```tsx
import { View, Text, Switch } from 'react-native';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(false);

  return (
    <View>
      <Text>Notifications</Text>
      <Switch
        value={notifications}
        onValueChange={setNotifications}
      />
    </View>
  );
}
```

---

## 17. Forms and validation

Forms collect user input.

Basic validation example:

```tsx
const handleSubmit = () => {
  if (text.length === 0) {
    alert('Field cannot be empty');
    return;
  }

  console.log('Form submitted');
};
```

## 19. Summary

This guide covers many of the common building blocks of an Expo application:

- splash screens
- icons
- checkboxes
- images
- keeping the screen awake
- buttons
- inputs
- switches
- scrolling lists
- navigation
- modals
- styling
- local images
- settings pages
- forms

These tools form the foundation for building most mobile app interfaces with Expo.

