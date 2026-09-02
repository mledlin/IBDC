/**
 * Device context for sharing the currently selected or connected device across the application.
 *
 * This file defines the device data shape, creates the context, provides the context wrapper
 * component, and exposes a custom hook for safely accessing device state.
 */

import React, {createContext, useContext, useState} from "react";
import { BleAdapter, BleDeviceInfo } from "../ble/BleAdapter";
import { MockBleAdapter } from "@/ble/MockBleAdapter";


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
};

/**
 * Internal React context used to hold shared device state. It is initialized as undefined.
 */
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

//!!real adatper will be used in production, mock adapter is for testing and development
const bleAdapter: BleAdapter = new MockBleAdapter();

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

    setDevice({
      id: deviceId,
      name: selectedDevice.name || "Unknown IBDC Device",
      status: 'connected',
      //Temporary mock values for battery, storage, firmwareVersion, and lastSynced. eventually these will be retrieved from the device itself.
      battery: 100,
      storage: { used: 0, total: 100 },
      firmwareVersion: "0.2.1",
      lastSynced: new Date().toISOString(),
    });
  }
  async function disconnect() {
    await bleAdapter.disconnect();
    setDevice(null);
  }

  return (
    <DeviceContext.Provider value={{ device, devices, isConnected: bleAdapter.isConnected(), scan, connect, disconnect, }}>
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