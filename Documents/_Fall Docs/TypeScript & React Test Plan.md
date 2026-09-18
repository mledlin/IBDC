# IBDC Test Plan

## Test Cases

See All Test Cases.xlsx in dev/documents for project test-cases.

The spreadsheet defines the test cases, inputs, outputs, and expected results. Automated tests should be written to implement the applicable cases from that file.

## Recommended Framework

Jest is what I'd recommended as our test framework for this project as Expo directly recommends Jest with the available 
jest-expo preset, which provides much of the configuration and mocking needed for Expo and native modules. Jest is also 
mature and widely used. That makes it an easy choice for testing.

Source: https://docs.expo.dev/develop/unit-testing/

### Jest

Main packages:

- `jest`
- `jest-expo`
- `@types/jest`
- `@testing-library/react-native`


### Installing Jest

Install Jest:
```bash
npx expo install jest-expo
npm install --save-dev jest
npm install --save-dev @types/jest
npm install --save-dev @testing-library/react-native
````

Running Tests

```bash
npm test
```

or run just one test file.

```bash
npm test -- RideSessionFilters.test.ts
```

## Common Test File Names

TypeScript naming convention:

```text
<FILE NAME>.test.ts
Example: Incident.test.ts
```

## Folder Structure

Tests should be in a dedicated test directory named as shown.

```text
__tests__
   domain/
   database/
   ble/
   ui/
   etc/
```

## Basic Jest Test Format

Example from: https://docs.expo.dev/develop/unit-testing/
```tsx
import { render } from '@testing-library/react-native';

import HomeScreen, { CustomText } from '@/app/index';

describe('<HomeScreen />', () => {
  test('Text renders correctly on HomeScreen', async () => {
    const { getByText } = await render(<HomeScreen />);

    getByText('Welcome!');
  });
});
```

## General tips

Use mocks for external inputs like:

```text
BLE hardware
GPS
network requests
database dependencies
```

Make use of Factory Functions for repeatable baselines.

```ts
makeIncident()
makeSession()
makeImage()
makeEventNotification()
```

Each test should create or configure the data it needs.

**Tests should not depend on another test running first.**

## Suggested package.json scripts

--watch will enable watch mode which auto reruns tests upon update.
-o runs tests (via watch) related to changed files only
--coverage generates a code coverage report.
```json
{
  "scripts": {
    "test": "jest --coverage",
    "testAndWatch": "jest -o --watch",
    "testSimple": "jest"
  }
}
```