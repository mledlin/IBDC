import React, { createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'original' | 'sleek' | 'wildcard'; 

export interface AppTheme {
    key: ThemeKey; 
    colors: {
        background: string;
        surface: string; 
        surfaceAlt: string;
        primary: string; 
        primaryForeground: string; 
        text: string; 
        textSecondary: string;
        border: string;
        danger: string;
        returnArrow: string;
    }; 
    typography: {
        fontFamily: string;
        headingWeight: '400' | '600' | '700' | '800' | '900';
    };
    radii: {
        sm: number;
        md: number;
        lg: number;
        full: number;
    };
}

//Concrete theme objects here... add more if needed. 
export const themes: Record<ThemeKey, AppTheme> = {
  original: {
    key: 'original',
    colors: {
      background: '#0e1ce6',
      surface: '#ffffff',
      surfaceAlt: '#242424',
      primary: '#e93a2e',
      primaryForeground: '#FFFFFF',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#2E2E2E',
      danger: '#FF4D4D',
      returnArrow: '#FF4D4D',
    },
    typography: { fontFamily: 'System', headingWeight: '700' },
    radii: { sm: 6, md: 12, lg: 20, full: 999 },
  },
  sleek: {
    key: 'sleek',
    colors: {
      background: '#F7F7F5',
      surface: '#FFFFFF',
      surfaceAlt: '#EFEFEC',
      primary: '#1A1A1A',
      primaryForeground: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#999999',
      border: '#E5E5E0',
      danger: '#D0392B',
      returnArrow: '#1A1A1A',
    },
    typography: { fontFamily: 'System', headingWeight: '600' },
    radii: { sm: 2, md: 4, lg: 8, full: 999 },
  },
  wildcard: {
    key: 'wildcard',
    colors: {
      background: '#0D0015',
      surface: '#9e3eec',
      surfaceAlt: '#26004A',
      primary: '#FF2EF7',
      primaryForeground: '#0D0015',
      text: '#F0E6FF',
      textSecondary: '#e1d5eb',
      border: '#4A0080',
      danger: '#FF4466',
      returnArrow: '#F0E6FF',
    },
    typography: { fontFamily: 'System', headingWeight: '900' },
    radii: { sm: 12, md: 20, lg: 32, full: 999 },
  },
};




interface ThemeContextType {
    theme: AppTheme; 
    themeKey: ThemeKey;
    setTheme: (key: ThemeKey) => void; 
}

const ThemeContext = createContext<ThemeContextType>({
    theme: themes.original,
    themeKey: 'original',
    setTheme: () => {}, 
});

const STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: {children: React.ReactNode}) {
    const [themeKey, setThemeKey] = useState<ThemeKey>('original');

    useEffect(()=>{
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
            if (val && val in themes) setThemeKey(val as ThemeKey);
        });
    }, []);
    
    const setTheme = async (key: ThemeKey) => {
        setThemeKey(key);
        await AsyncStorage.setItem(STORAGE_KEY, key);
    };
    return(
        <ThemeContext.Provider value={{theme: themes[themeKey], themeKey, setTheme}}>
            {children}
        </ThemeContext.Provider>
    );

    }
export function useTheme() { 
    return useContext(ThemeContext);
}