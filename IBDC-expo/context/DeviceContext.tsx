import React, {createContext, useContext, useState} from "react";

type ConnectedStatus = 'connected' | 'disconnected' | 'pairing';

export interface DeviceInfo {
  name: string;
  status: ConnectedStatus;
  battery: number;
  storage: { used: number; total: number };
  firmwareVersion: string;
  lastSynced: string;
  id?: string; 
}

type DeviceContextType = {
  device: DeviceInfo | null;
  setDevice: React.Dispatch<React.SetStateAction<DeviceInfo | null>>;
};

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  return (
    <DeviceContext.Provider value={{ device, setDevice }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used inside DeviceProvider");
  }
  return context;
}