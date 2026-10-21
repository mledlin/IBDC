export interface BleDeviceInfo {
    id: string;
    name?: string;
}
export interface BleAdapter {
    /**
     * Connects to a BLE device with the specified device ID.
     * @param deviceId The ID of the BLE device to connect to.
     * @returns A promise that resolves when the connection is successful.
     */
    scan(): Promise<BleDeviceInfo[]>;
    connect(deviceId: string): Promise<void>;
    disconnect(): Promise<void>;
    sendData(data: Uint8Array): Promise<void>;
    onDataReceived(callback: (data: Uint8Array) => void): void;
    isConnected(): boolean;
    getConnectedDeviceId(): string | null;
}