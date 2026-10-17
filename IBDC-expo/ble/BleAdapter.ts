/**
 * Identifies a BLE device discovered by an adapter.
 */
export interface BleDeviceInfo {
    /** The platform-specific identifier used to connect to the device. */
    id: string;
    /** A human-readable device name, when the platform provides one. */
    name?: string;
}

/**
 * Platform-independent interface for scanning and exchanging bytes with BLE devices.
 */
export interface BleAdapter {
    /**
     * Discovers nearby BLE devices.
     * @returns A promise that resolves with the discovered devices.
     */
    scan(): Promise<BleDeviceInfo[]>;

    /**
     * Connects to the BLE device with the specified identifier.
     * @param deviceId Identifier of the device to connect to.
     * @returns A promise that resolves when the connection is established.
     */
    connect(deviceId: string): Promise<void>;

    /**
     * Disconnects from the current device, if connected.
     * @returns A promise that resolves when disconnection completes.
     */
    disconnect(): Promise<void>;

    /**
     * Sends raw bytes to the connected device.
     * @param data Bytes to transmit.
     * @returns A promise that resolves when the write completes.
     */
    sendData(data: Uint8Array): Promise<void>;

    /**
     * Registers a handler for bytes received from the connected device.
     * @param callback Handler invoked with each received byte sequence.
     */
    onDataReceived(callback: (data: Uint8Array) => void): void;

    /**
     * Registers a handler for device disconnections.
     * @param callback Handler invoked with the identifier of the disconnected device.
     * @returns A function that unregisters this handler.
     */
    onDisconnected(callback: (deviceId: string) => void): () => void;

    /**
     * Checks whether a device is currently connected.
     * @returns `true` if connected; otherwise, `false`.
     */
    isConnected(): boolean;

    /**
     * Gets the identifier of the currently connected device.
     * @returns The connected device identifier, or `null` if disconnected.
     */
    getConnectedDeviceId(): string | null;
}