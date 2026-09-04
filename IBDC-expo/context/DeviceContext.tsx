/**
 * Device context for sharing the currently selected or connected device across the application.
 *
 * This file defines the device data shape, creates the context, provides the context wrapper
 * component, and exposes a custom hook for safely accessing device state.
 */

import React, {createContext, useContext, useEffect, useState} from "react";
import { BleAdapter, BleDeviceInfo } from "@/ble/BleAdapter";
import { MockBleAdapter } from "@/ble/MockBleAdapter";
import { IBDCCommunicationService, DeviceStatus as IBDCDeviceStatus } from "@/services/IBDCCommunicationService";
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";


type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

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
}

/**
 * device:
 * the currently selected or connected device, or null if none is set.
 *
 * setDevice:
 * state setter used to update the current device.
 */
type DeviceContextType = {
  device: DeviceInfo | null;
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
};

/**
 * Internal React context used to hold shared device state. It is initialized as undefined.
 */
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

//!!real adatper will be used in production, mock adapter is for testing and development
// kept as concrete MockBleRefrence because SimulatedIBDC needs simulateIncomming(),
// which isn't a part of the BleAdapter interface or the real implementation.
const mockBLEAdapter = new MockBleAdapter();
const bleAdapter: BleAdapter = mockBLEAdapter;

// Sits between bleAdapter and this context (and any other domain services),
const communicationService = new IBDCCommunicationService(bleAdapter);

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

  // keep connceted device state in sync with decoded DeviceStatus pushes. 
  // only update stat is a device is currently set; ignore otherwise
  useEffect(() => {
    const unsubscribe = communicationService.onDeviceStatus((status: IBDCDeviceStatus) => {
      setDevice(prevDevice => {
        if(!prevDevice){
          return prevDevice;
        }
        return { 
          ...prevDevice,
          battery: status.batteryPercent,
          pendingEvents: status.pendingEventCount,
          storage: {
            used: 100 - status.storageAvailablePercent,
            total: 100,
          },
          lastSynced: new Date().toISOString(),
        };
      });
    });

    return unsubscribe;
  }, []);

  async function scan(): Promise<void> {
    const foundDevices = await bleAdapter.scan();
    setDevices(foundDevices);
  }

  async function connect(deviceId: string): Promise<void> {
    await bleAdapter.connect(deviceId);

    const selectedDevice = devices.find((d) => d.id === deviceId);
    if (!selectedDevice) {
      throw new Error(`Device with ID ${deviceId} not found in scanned devices.`);
    }

    const initalState = simulatedDevice.getState();

    setDevice({
      id: deviceId,
      name: selectedDevice.name || "Unknown IBDC Device",
      status: 'connected',
      //Temporary mock values for battery, storage, firmwareVersion, and lastSynced. eventually these will be retrieved from the device itself.
      battery: initalState.batteryPercent,
      storage: { 
        used: 100 - initalState.storageAvailablePercent, 
        total: 100 },
      firmwareVersion: initalState.protocolVersion,
      lastSynced: new Date().toISOString(),
      pendingEvents: initalState.pendingEventCount,
    });

    simulatedDevice.start();
  }
  async function disconnect() {
    simulatedDevice.stop();
    await bleAdapter.disconnect();
    setDevice(null);
  }

  return (
    <DeviceContext.Provider value={{ device, devices, isConnected: bleAdapter.isConnected(), scan, connect, disconnect, communicationService }}>
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