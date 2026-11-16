import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * This function is a generic way to store and retrieve items from Async storage across the program.
 * @param key
 * @param initialValue values to load into the store
 */
export function useAsyncStorage (key: string, initialValue: string) {
    const [storedValue, setStoredValue] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. System-prompted retrieve (runs automatically on mount), only re-runs when key value changes
    useEffect(() => {
        let isMounted: boolean = true;

        const loadStoredValue = async () => {
            try {
                const item: string | null = await AsyncStorage.getItem(key);
                if (isMounted && item !== null) {
                    setStoredValue(JSON.parse(item));
                }
            }
            catch (error: any) {
                setError(error);
            }
            finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        loadStoredValue();
        return () => {
            isMounted = false;
        }
    }, [key])

    const setValue = useCallback(async (value: string | Function) => {
        try {
            setError(null);

            // Allow value to be a function just like standard useState
            const valueToStore: string  = value instanceof Function ? value(storedValue) : value;

            // Update React state immediately so the UI feels instant
            setStoredValue(valueToStore);

            // Persist to AsyncStorage in the background
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (err: any) {
                setError(err);
            }

        },[key, storedValue]);

    return {
        storedValue: storedValue,
        error: error,
        isLoading: isLoading
    }
}


