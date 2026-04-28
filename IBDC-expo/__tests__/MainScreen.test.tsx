import React from 'react';
import { render } from '@testing-library/react-native';
import MainScreen from '@/app/MainScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#fff',
        surface: '#f0f0f0',
        border: '#ccc',
        primary: '#000',
        primaryForeground: '#fff',
        text: '#000',
        textSecondary: '#666',
      },
      radii: { md: 8 },
    },
  }),
}));

jest.mock('@/context/DeviceContext', () => ({
  useDevice: () => ({ device: null }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../assets/images/device-placeholder.png', () => 1);

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('<MainScreen />', () => {
  test('renders Pair Device button', () => {
    const { getByText } = render(<MainScreen />);
    getByText('Pair Device');
  });

  test('renders battery percentage', () => {
    const { getByText } = render(<MainScreen />);
    getByText('78%');
  });

  test('renders storage percentage', () => {
    const { getByText } = render(<MainScreen />);
    getByText('42.5%');
  });

  test('renders Ride Sessions button', () => {
    const { getByText } = render(<MainScreen />);
    getByText('Ride Sessions');
  });

  test('renders Settings button', () => {
    const { getByText } = render(<MainScreen />);
    getByText('Settings');
  });

  test('renders firmware info', () => {
    const { getByText } = render(<MainScreen />);
    getByText(/Firmware v1\.0/);
  });

  test('renders connected status', () => {
    const { getByText } = render(<MainScreen />);
    getByText('Connected');
  });
});