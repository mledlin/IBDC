import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * This function is a generic way to store and retrieve items from Async storage across the program.
 * @param key
 * @param initialValue values to load into the store
 */
export function useAsyncStorage (key: string, initialValue?: any) {
    const [data, setData] = useState<string | null>(initialValue === undefined ? null : JSON.stringify(initialValue));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    //console.log("Initial value passed to asyncStorage: " + initialValue + "\n");

    // 1. System-prompted retrieve (runs automatically on mount) only re-runs when key value changes
    useEffect(() => {
        let isMounted = true;

        const loadStoredValue = async () => {
            try {
                setIsLoading(true);

                const storedValue = await AsyncStorage.getItem(key);

                if (!isMounted) return;

                if (storedValue !== null) {
                    setData(storedValue);
                } else if (initialValue !== undefined) {
                    setData(JSON.stringify(initialValue));
                } else {
                    setData(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadStoredValue();

        return () => {
            isMounted = false;
        };
    }, [key, initialValue]);

    const setValue = useCallback(async (value: any) => {
        console.log("useAsyncStorage:setValue - params {key} {value}", key, value);
        try {
            setError(null);

            // Silent failing? No, the value won't be saved but that won't fail any other component.
            if (value === undefined) {
                console.error("useAsyncStorage:setValue - params_constraint can't be undefined");
                return new Promise<void> ((resolve) => {})
            }

            // Allow value to be a function just like standard useState
            const valueToStore: string  = JSON.stringify(value);

            // Update React state immediately so the UI feels instant
            setData(valueToStore);
            console.log("useAsyncStorage:setValue - local_var {valueToStore} ",  valueToStore);

            // Persist to AsyncStorage
            await AsyncStorage.setItem(key, valueToStore);

        }
        catch (err: any) {
                setError(err);
            }
        }, [key]);

    return {
        data: data,
        error: error,
        isLoading: isLoading,
        setValue: setValue
    }
}


