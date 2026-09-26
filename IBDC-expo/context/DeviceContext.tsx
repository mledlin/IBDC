/**
 * Device context for sharing the currently selected or connected device across the application.
 *
 * This file defines the device data shape, creates the context, provides the context wrapper
 * component, and exposes a custom hook for safely accessing device state.
 */

import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BleAdapter, BleDeviceInfo } from "@/ble/BleAdapter";
import { MockBleAdapter } from "@/ble/MockBleAdapter";
import { IBDCCommunicationService, DeviceStatus as IBDCDeviceStatus, PendingEventList } from "@/services/IBDCCommunicationService";
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { ImageIngestService } from "@/services/ImageIngestService";

export type DeviceMode = 'mock' | 'real';
export type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

/**
 * Describes the device information stored in shared context.
 */
export interface DeviceInfo {
  id: string;
  name: string;
  status: ConnectedStatus;
  battery: number;
  storage: { used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
  pendingEvents?: number; // Number of events on the device not yet acknowledged by the phone. Populated from decoded DeviceStatus messages once the device reports it.
  imagesPerEventOnDevice?: number;
}

const IMAGES_PER_EVENT_KEY = "imagesPerEvent";
// Default when user has never saved a preferance.
const DEFAULT_IMAGES_PER_EVENT = 10;

/**
 * device:
 * the currently selected or connected device, or null if none is set.
 *
 * setDevice:
 * state setter used to update the current device.
 */
type DeviceContextType = {
  device: DeviceInfo | null;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => Promise<void>;
  devices: BleDeviceInfo[];
  isConnected: boolean;
  scan: () => Promise<void>;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  // Exposed so other domain services (e.g. incident reporting) can subscribe
  // directly to message types DeviceContext itself doesn't own, such as
  // EventNotification, without DeviceContext needing to know about every
  // message type that flows over BLE.
  communicationService: IBDCCommunicationService;
  triggerTestEvent: (imageCount?: number) => Promise<void>;
  desiredImagesPerEvent: number;
  setImagesPerEvent: (count: number) => Promise<void>; 
};

/**
 * Internal React context used to hold shared device state. It is initialized as undefined.
 */
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

//!!real adatper will be used in production, mock adapter is for testing and development
// kept as concrete MockBleRefrence because SimulatedIBDC needs simulateIncomming(),
// which isn't a part of the BleAdapter interface or the real implementation.
const mockBLEAdapter = new MockBleAdapter();
let bleAdapter: BleAdapter = mockBLEAdapter;

// Sits between bleAdapter and this context (and any other domain services),
const communicationService = new IBDCCommunicationService(bleAdapter);

new ImageIngestService(communicationService);

const simulatedDevice = new SimulatedIBDC(mockBLEAdapter);

/**
 * Wraps part of the application with shared device state.
 *
 * This provider stores the current device in local state and makes both
 * the value and its setter available to all descendant components.
 *
 * @param children The child components that should have access to device context.
 * @returns A context provider containing device state and update access.
 */
export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
  const [deviceMode, setMode] = useState<DeviceMode>('mock');
  const modeRef = useRef<DeviceMode>('mock');
  const [desiredImagesPerEvent,setDesiredImagesPerEvent,] = useState(DEFAULT_IMAGES_PER_EVENT);
  const desiredImagesPerEventRef = useRef(DEFAULT_IMAGES_PER_EVENT);
  const settingsLoadedRef = useRef(false);
   useEffect(()=>{
    async function loadDeviceSettings() {
      try{ 
        const stroedValue = await AsyncStorage.getItem(IMAGES_PER_EVENT_KEY);
        if(stroedValue !== null){
          const parsedValue = Number(stroedValue);
          if(Number.isInteger(parsedValue) && parsedValue > 0) {
            setDesiredImagesPerEvent(parsedValue);
            desiredImagesPerEventRef.current = parsedValue;
          }
        }
      }catch(error){
        console.error("DeviceContext: failed to load images-per-evetn setting:", error);
      }finally{
        settingsLoadedRef.current = true;
      }
    }
        void loadDeviceSettings();
      }, []);
  //Adapter switching: Will not be needed in final implementation. 
  // Used to swtich between mock device and real for demonstration and testing. 
  async function changeMode(mode: DeviceMode): Promise<void> {
    if (mode === modeRef.current) { return; }
      if (modeRef.current == 'mock') simulatedDevice.stop();
      await bleAdapter.disconnect();
      //load the native BLE module only when the real device is selected.
      const nextAdapter: BleAdapter = mode === 'mock' 
      ? mockBLEAdapter 
      : new (require('@/ble/RealBleAdapter').RealBleAdapter)();
      bleAdapter = nextAdapter;
      communicationService.setAdapter(nextAdapter);
      modeRef.current = mode;
      setMode(mode);
      setDevice(null);
      setDevices([]);
    }
  
  async function setImagesPerEvent(count: number): Promise<void> {
    if(!Number.isInteger(count) || count < 1){
      throw new Error("Images per Evetn must at least be 1");
    }
    setDesiredImagesPerEvent(count);
    desiredImagesPerEventRef.current= count;
    await AsyncStorage.setItem(IMAGES_PER_EVENT_KEY, String(count));

    //if there is already an active BLE connection, update the device immediately
    // if disconnected, the app will reconcile this setting the next time DeviceStatus arrives.

    if(bleAdapter.isConnected()){
      console.log( `DeviceContext: sending images=per=event setting ${count}`);
    
    await communicationService.writeSettings({imagesPerEventSetting: count,});
  }
  }


  // DeviceStatus Messages:
  // keep connceted device state in sync with decoded DeviceStatus pushes. 
  // only update stat is a device is currently set; ignore otherwise
  //
  useEffect(() => {
    const unsubscribe = communicationService.onDeviceStatus((status: IBDCDeviceStatus) => {
      setDevice(prevDevice => {
        if(!prevDevice){
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
      if (!settingsLoadedRef.current){
        return;
      }
      const desired = desiredImagesPerEventRef.current;
      if(status.imagesPerEventSetting !== desired){
        console.log(`DeviceContext: images-per-event mismatch.`);
        communicationService.writeSettings({imagesPerEventSetting: desired,}).catch((error)=> {
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
  async function handlePendingEvents(eventIds: number[]): Promise<void> {
    if (eventIds.length === 0) {
      console.log("DeviceContext: no pending events on device.");
      return;
    }
    console.log("DeviceContext: recovering pending events:", eventIds);
    // For now, request sequentially rather than sending over all the request all at once. 
    // This may be something we can optimize later if the other team has the hardware support multiple simultaneous transfers. 
    for(const eventId of eventIds){
      try{
        console.log(`DeviceContest: requesting pennding event ${eventId}`);
        await communicationService.requestEventInfo(eventId);
      } catch(error){
        console.error(`DeviceContext: failed to request pending evetn ${eventId}:`, error);
      }
    }
  }

  /**
   *  Subscribe to PendingEventList message from the device. 
   */
  useEffect(() => {
    const unsubscribe = communicationService.onPendingEventList((pendingList: PendingEventList) => {
          void handlePendingEvents(pendingList.eventIds);
        }
      );
    return unsubscribe;
  }, []);


  /**
   *  Scanning
   */
  async function scan(): Promise<void> {
    const foundDevices = await bleAdapter.scan();
    setDevices(foundDevices);
  }

  /**
   *  Connection
   */
  async function connect(deviceId: string): Promise<void> {
    const selectedDevice = devices.find((canidate) => canidate.id === deviceId);
    if (!selectedDevice) {
      throw new Error(`Device with ID ${deviceId} not found in scanned devices.`);
    }
    await bleAdapter.connect(deviceId);
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
        total: 100 },
      firmwareVersion: initalState?.firmwareVersionLabel ?? "Unknown",
      lastSynced: new Date().toISOString(),
      pendingEvents: initalState?.pendingEventCount,
      imagesPerEventOnDevice: initalState?.imagesPerEventSetting,
    });

    if (modeRef.current === 'mock') {simulatedDevice.start();}
    // Every successful connection/reconnection begins with a sync request. 
    // The device responds with a PendingEventList
    try {
      console.log("DeviceContext: requesting pending events after communication.");
      await communicationService.requestPendingEvents();
    }catch(error){
      console.error("DeviceContext: failed to request pending events:", error);
    }
  }

  async function disconnect() {
    if (modeRef.current === 'mock') simulatedDevice.stop();
    await bleAdapter.disconnect();
    setDevice(null);
  }

  // Development testing hook: Makes mock device simulate a detection event with imageCount photos
  // hardcoded, will need to be updated later to reflect real images per event.
  async function triggerTestEvent(imageCount: number = 3): Promise<void>{
    if (!device || modeRef.current !== 'mock') {
      throw new Error("cannot trigger a test event: no device is connected");
    }
    await simulatedDevice.triggerEvent({imageCount})
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
 * Returns the current device context.
 *
 * @returns The shared device state and setter function.
 */
export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used inside DeviceProvider");
  }
  return context;
}