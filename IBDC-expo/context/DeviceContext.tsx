/**
 * Device context for sharing the currently selected or connected device across the application.
 *
 * This file defines the shared device data and BLE operations, provides the
 * context wrapper component, and exposes a hook for accessing that context.
 */

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {BleAdapter, BleDeviceInfo} from "@/ble/BleAdapter";
import {MockBleAdapter} from "@/ble/MockBleAdapter";
import {
    IBDCCommunicationService,
    DeviceStatus as IBDCDeviceStatus,
    PendingEventList
} from "@/services/IBDCCommunicationService";
import {SimulatedIBDC} from "@/ble/SimulatedIBDC";
import {ImageIngestService} from "@/services/ImageIngestService";
import { ExpoImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "@/services/DAOAdapter";
import { SimulatedIBDCImageLoader } from "@/ble/SimulatedIBDCImageLoader"

/** Selects between the hardware BLE adapter and the in-memory mock adapter. */
export type DeviceMode = 'mock' | 'real';
/** Connection state exposed for the selected device. */
export type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

/**
 * Describes the device information stored in shared context.
 */
export interface DeviceInfo {
  /** Platform identifier of the device. */
    id: string;
  /** Display name of the device. */
    name: string;
  /** Current connection state. */
    status: ConnectedStatus;
  /** Remaining battery charge, as a percentage. */
    battery: number;
  /** Device storage usage and capacity, represented as percentages. */
    storage: { used: number; total: number };
  /** Reported or simulated firmware version. */
    firmwareVersion: string;
  /** ISO timestamp of the most recent synchronization. */
    lastSynced: string;
  /** Number of device events not yet acknowledged by the app, when known. */
  pendingEvents?: number;
  /** Number of images configured per event on the device, when known. */
    imagesPerEventOnDevice?: number;
}

/** AsyncStorage key used to persist the preferred images-per-event setting. */
const IMAGES_PER_EVENT_KEY = "imagesPerEvent";
/** Images-per-event value used before a user has saved a preference. */
const DEFAULT_IMAGES_PER_EVENT = 10;

/**
 * Values and operations made available to components under {@link DeviceProvider}.
 */
type DeviceContextType = {
  /** Currently selected or connected device, or `null` if none is set. */
    device: DeviceInfo | null;
  /** Active BLE mode. */
    deviceMode: DeviceMode;
  /** Changes the active BLE mode and resets the selected device. */
    setDeviceMode: (mode: DeviceMode) => Promise<void>;
  /** Devices found by the most recent scan. */
    devices: BleDeviceInfo[];
  /** Whether the active adapter currently has a connection. */
    isConnected: boolean;
  /** Scans for available BLE devices and updates the device list. */
    scan: () => Promise<void>;
  /** Connects to a device returned by the most recent scan. */
    connect: (deviceId: string) => Promise<void>;
  /** Disconnects from the currently connected device. */
    disconnect: () => Promise<void>;
  /**
   * Communication service for subscribing to decoded BLE message types beyond
   * the device state managed directly by this context.
   */
    communicationService: IBDCCommunicationService;
  /** Triggers a simulated detection event in mock mode. */
    triggerTestEvent: (imageCount?: number) => Promise<void>;
  /** Desired images-per-event setting saved by the app. */
    desiredImagesPerEvent: number;
  /** Persists the desired image count and synchronizes it with a connected device. */
    setImagesPerEvent: (count: number) => Promise<void>;
};

/**
 * Internal React context used to hold shared device state. It is initialized as undefined.
 */
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

/** Shared mock adapter used by the simulator and selected in mock mode. */
const mockBLEAdapter = new MockBleAdapter();
let bleAdapter: BleAdapter = mockBLEAdapter;

/** Shared protocol service used by the context and domain services. */
const communicationService = new IBDCCommunicationService(bleAdapter);

// Abstractions built around hardware coupling
const imageStorage = new ExpoImageStorage();
const imageLoader = new SimulatedIBDCImageLoader();
const DAOAccess = new DAOAdapter();

const imageIngestService = new ImageIngestService(communicationService, imageStorage, DAOAccess);

const simulatedDevice = new SimulatedIBDC(mockBLEAdapter, imageLoader);

/**
 * Wraps part of the application with shared device state.
 *
 * This provider stores device connection state and BLE operations and makes
 * them available to all descendant components.
 *
 * @param children The child components that should have access to device context.
 * @returns A context provider containing device state and update access.
 */
export function DeviceProvider({children}: { children: React.ReactNode }) {
    const [device, setDevice] = useState<DeviceInfo | null>(null);
    const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
    const [deviceMode, setMode] = useState<DeviceMode>('mock');
    const modeRef = useRef<DeviceMode>('mock');
    const [desiredImagesPerEvent, setDesiredImagesPerEvent,] = useState(DEFAULT_IMAGES_PER_EVENT);
    const desiredImagesPerEventRef = useRef(DEFAULT_IMAGES_PER_EVENT);
    const settingsLoadedRef = useRef(false);
  const disconnectListenerRef = useRef<(() => void) | null>(null);

  /** Replaces the adapter's disconnection subscription with one for the given adapter. */
  function subscribeToAdapterDisconnect(adapter: BleAdapter): void {
    disconnectListenerRef.current?.();
    disconnectListenerRef.current = adapter.onDisconnected((deviceId) => {
      setDevice((currentDevice) => {
        if (!currentDevice || currentDevice.id !== deviceId) {
          return currentDevice;
        }
        return {...currentDevice, status: 'disconnected'};
      });
    });
  }

  useEffect(() => {
    subscribeToAdapterDisconnect(bleAdapter);
    return () => disconnectListenerRef.current?.();
  }, []);

    useEffect(() => {
    /** Loads the saved image-count preference before device status synchronization. */
        async function loadDeviceSettings() {
            try {
                const stroedValue = await AsyncStorage.getItem(IMAGES_PER_EVENT_KEY);
                if (stroedValue !== null) {
                    const parsedValue = Number(stroedValue);
                    if (Number.isInteger(parsedValue) && parsedValue > 0) {
                        setDesiredImagesPerEvent(parsedValue);
                        desiredImagesPerEventRef.current = parsedValue;
                    }
                }
            } catch (error) {
                console.error("DeviceContext: failed to load images-per-evetn setting:", error);
            } finally {
                settingsLoadedRef.current = true;
            }
        }

        void loadDeviceSettings();
    }, []);
  /**
   * Switches BLE adapters and clears device state associated with the prior mode.
   * @param mode Mode to activate.
   * @returns A promise that resolves after the previous connection is closed.
   */
    async function changeMode(mode: DeviceMode): Promise<void> {
        if (mode === modeRef.current) {
            return;
        }
        if (modeRef.current == 'mock') simulatedDevice.stop();
        await bleAdapter.disconnect();
        //load the native BLE module only when the real device is selected.
        const nextAdapter: BleAdapter = mode === 'mock'
            ? mockBLEAdapter
            : new (require('@/ble/RealBleAdapter').RealBleAdapter)();
        bleAdapter = nextAdapter;
      subscribeToAdapterDisconnect(nextAdapter);
        communicationService.setAdapter(nextAdapter);
        modeRef.current = mode;
        setMode(mode);
        setDevice(null);
        setDevices([]);
    }

  /**
   * Saves the desired image count and sends it to the device when connected.
   * @param count Positive integer number of images per event.
   * @throws If `count` is not a positive integer or persistence/sending fails.
   */
    async function setImagesPerEvent(count: number): Promise<void> {
        if (!Number.isInteger(count) || count < 1) {
            throw new Error("Images per Evetn must at least be 1");
        }
        setDesiredImagesPerEvent(count);
        desiredImagesPerEventRef.current = count;
        await AsyncStorage.setItem(IMAGES_PER_EVENT_KEY, String(count));

        //if there is already an active BLE connection, update the device immediately
        // if disconnected, the app will reconcile this setting the next time DeviceStatus arrives.

        if (bleAdapter.isConnected()) {
            console.log(`DeviceContext: sending images=per=event setting ${count}`);

            await communicationService.writeSettings({
                imagesPerEvent: count,
            });
    await communicationService.writeSettings({imagesPerEvent: count});
        }
    }


    // DeviceStatus Messages:
    // keep connceted device state in sync with decoded DeviceStatus pushes.
    // only update stat is a device is currently set; ignore otherwise
    //
    useEffect(() => {
        const unsubscribe = communicationService.onDeviceStatus((status: IBDCDeviceStatus) => {
            setDevice(prevDevice => {
                if (!prevDevice) {
                    return prevDevice;
                }
                return {
                    ...prevDevice,
                    battery: status.batteryPercent,
                    pendingEvents: status.pendingEvents,
                    imagesPerEventOnDevice: status.imagesPerEventSetting,
                    storage: {
                        used: 100 - status.storageAvailablePercent,
                        total: 100,
                    },
                    lastSynced: new Date().toISOString(),

                };
            });
            if (!settingsLoadedRef.current) {
                return;
            }
            const desired = desiredImagesPerEventRef.current;
            if (status.imagesPerEventSetting !== desired) {
                console.log(`DeviceContext: images-per-event mismatch.`);
                communicationService.writeSettings({
                    imagesPerEvent: desired,
                }).catch((error) => {
                    console.error(
                        "DeviceContext: failed to synchronize images-per-event settings:",
                        error,
                    );
                });
        communicationService.writeSettings({imagesPerEvent: desired}).catch((error)=> {
          console.error("DeviceContext: failed to synchronize images-per-event settings:", error);
        })
            }
        });
        return unsubscribe;
    }, []);

    /**
     * Pending-event recovery:
     * Handle the PendingEventList Returned by the IBDC device at connection/ reconnection.
     * Each Id represents an event that the deivce believes has not
     * yet been completely acknowleged by the application.
     * We will request EventNotification metadata for each one,
     * Then ImageIngestService will recieve the resulting
     * EventNotification and continure through the normal image transfer pipeline.
     */
  /**
   * Requests notification metadata for each unacknowledged event reported by
   * the device, allowing the regular image-ingest flow to resume.
   * @param eventIds Identifiers of pending device events.
   */
    async function handlePendingEvents(eventIds: number[]): Promise<void> {
        if (eventIds.length === 0) {
            console.log("DeviceContext: no pending events on device.");
            return;
        }
        console.log("DeviceContext: recovering pending events:", eventIds);
        // For now, request sequentially rather than sending over all the request all at once.
        // This may be something we can optimize later if the other team has the hardware support multiple simultaneous transfers.
        for (const eventId of eventIds) {
            try {
                console.log(`DeviceContest: requesting pennding event ${eventId}`);
                await communicationService.requestEventInfo(eventId);
            } catch (error) {
                console.error(`DeviceContext: failed to request pending evetn ${eventId}:`, error);
            }
        }
    }

  /** Subscribes to pending-event lists so interrupted transfers can be recovered. */
    useEffect(() => {
        const unsubscribe = communicationService.onPendingEventList((pendingList: PendingEventList) => {
                void handlePendingEvents(pendingList.eventIds);
            }
        );
        return unsubscribe;
    }, []);


    /**
   * Scans for devices using the active adapter and stores the results.
   * @returns A promise that resolves when the scan completes.
     */
    async function scan(): Promise<void> {
        const foundDevices = await bleAdapter.scan();
        setDevices(foundDevices);
    }

    /**
   * Connects to a device from the latest scan and starts event synchronization.
   * @param deviceId Identifier of a device in the current scan results.
   * @returns A promise that resolves after connection setup and the initial sync request.
   * @throws If the device was not found or connection/session setup fails.
     */
    async function connect(deviceId: string): Promise<void> {
        const selectedDevice = devices.find((canidate) => canidate.id === deviceId);
        if (!selectedDevice) {
            throw new Error(`Device with ID ${deviceId} not found in scanned devices.`);
        }
        await bleAdapter.connect(deviceId);
    try {
      await imageIngestService.createConnectionSession(new Date());
    } catch (error) {
      try {
        await bleAdapter.disconnect();
      } catch (disconnectError) {
        console.error("DeviceContext: failed to disconnect after session creation failed:", disconnectError);
      }
      throw error;
    }
        // Simulated device state only exist in mock mode.
        const initalState = modeRef.current === "mock" ? simulatedDevice.getState() : undefined;

        setDevice({
            id: deviceId,
            name: selectedDevice.name || "Unknown IBDC Device",
            status: 'connected',
            //Temporary mock values for battery, storage, firmwareVersion, and lastSynced. eventually these will be retrieved from the device itself.
            battery: initalState?.batteryPercent ?? 0,
            storage: {
                used: initalState ? 100 - initalState.storageAvailablePercent : 0,
                total: 100
            },
            firmwareVersion: initalState?.firmwareVersionLabel ?? "Unknown",
            lastSynced: new Date().toISOString(),
            pendingEvents: initalState?.pendingEventCount,
            imagesPerEventOnDevice: initalState?.imagesPerEventSetting,
        });

        if (modeRef.current === 'mock') {
            simulatedDevice.start();
        }
        // Every successful connection/reconnection begins with a sync request.
        // The device responds with a PendingEventList
        try {
            console.log("DeviceContext: requesting pending events after communication.");
            await communicationService.requestPendingEvents();
        } catch (error) {
            console.error("DeviceContext: failed to request pending events:", error);
        }
    }

  /**
   * Stops the mock simulator when applicable and disconnects the active adapter.
   * @returns A promise that resolves when disconnection completes.
   */
  async function disconnect(): Promise<void> {
        if (modeRef.current === 'mock') simulatedDevice.stop();
        await bleAdapter.disconnect();
    }

  /**
   * Triggers a test event from the simulated device.
   * @param imageCount Optional number of images to include in the event.
   * @returns A promise that resolves after the event is generated.
   * @throws If no device is selected or the active mode is not mock.
   */
    async function triggerTestEvent(imageCount?: number): Promise<void> {
        if (!device || modeRef.current !== 'mock') {
            throw new Error("cannot trigger a test event: no device is connected");
        }
        await simulatedDevice.triggerEvent({imageCount: imageCount ?? simulatedDevice.getState().imagesPerEventSetting,})
    }

    return (
        <DeviceContext.Provider value={
                                    {
                                        device,
                                        deviceMode,
                                        setDeviceMode: changeMode,
                                        devices,
                                        isConnected: bleAdapter.isConnected(),
                                        scan,
                                        connect,
                                        disconnect,
                                        communicationService,
                                        triggerTestEvent,
                                        desiredImagesPerEvent,
                                        setImagesPerEvent,
                                    }}>
            {children}
        </DeviceContext.Provider>
    );
}

/**
 * Returns the shared device state and operations.
 *
 * @returns The device state and operations exposed by {@link DeviceProvider}.
 * @throws If called outside a {@link DeviceProvider}.
 */
export function useDevice() {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error("useDevice must be used inside DeviceProvider");
    }
    return context;
}