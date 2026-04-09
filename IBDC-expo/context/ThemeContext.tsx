import React, { createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'original' | 'sleek' | 'wildcard'; 
export const THEMES: Theme[] = ['original', 'sleek', 'wildcard'];


interface ThemeContextType {
    theme: Theme; 
    setTheme: (theme: Theme) => void; 
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'original',
    setTheme: () => {}, 
});

export const ThemeProvider = ({ children }: {children: React.ReactNode}) => {
    const [theme, setThemeState] = useState<Theme>('original');
    useEffect(()=>{
        AsyncStorage.getItem('theme').then(saved => {
            if (saved && (THEMES as string[]).includes(saved)) setThemeState(saved as Theme);
        });
    }, []);
    
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem('theme', newTheme);
    };
    return(
        <ThemeContext.Provider value={{theme, setTheme}}>
            {children}
        </ThemeContext.Provider>
    );

    }; 
export const useTheme = () => useContext(ThemeContext);