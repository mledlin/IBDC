import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * This function is a generic way to store and retrieve items from Async storage across the program.
 * @param key
 * @param initialValue values to load into the store
 */
export function useAsyncStorage (key: string, initialValue?: any) {
    const [data, setData] = useState(JSON.stringify(initialValue));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    console.log("Initial value passed to asyncStorage: " + initialValue + "\n");

    // 1. System-prompted retrieve (runs automatically on mount) only re-runs when key value changes
    useEffect(() => {
        let isMounted: boolean = true;

        const loadStoredValue = async () => {
            try {
                const item: string | null = await AsyncStorage.getItem(key);
                if (isMounted && initialValue !== null) {
                    setData(JSON.stringify(initialValue));
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

    const setValue = useCallback(async (value: any | Function) => {
        try {
            setError(null);

            // Allow value to be a function just like standard useState
            const valueToStore: string  = value instanceof Function ? value(data) : value;

            // Update React state immediately so the UI feels instant
            setData(valueToStore);

            // Persist to AsyncStorage in the background
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (err: any) {
                setError(err);
            }

        },[key, data]);
    console.log("Data stored in useAsyncStorage: " + data);

    return {
        data: data,
        error: error,
        isLoading: isLoading,
        setValue: setValue
    }
}


