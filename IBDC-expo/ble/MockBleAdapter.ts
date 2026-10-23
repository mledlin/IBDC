import {BleAdapter, BleDeviceInfo} from "../ble/BleAdapter";
import { ProtobufService } from "@/protobuf/ProtobufService";

/**
 * In-memory BLE adapter for exercising device communication without BLE hardware.
 */
export class MockBleAdapter implements BleAdapter {

    private connectedDeviceId: string | null = null;

    private recieveCallback: ((data: Uint8Array) => void) | null = null;

    private disconnectListeners = new Set<(deviceId: string) => void>();

    // Device-side callback for app -> device sends : Not part of the BLE Adapter interface
    private deviceReceiveCallback: ((data: Uint8Array) => void) | null = null;

    private deviceInfo: BleDeviceInfo | null = null;

    /**
     * Sets the simulated device returned by scans and accepted by connections.
     * @param info Information identifying the simulated device.
     */
    setDeviceInfo(info: BleDeviceInfo): void {
        this.deviceInfo = info;
    }

    /**
     * Gets the information for the configured simulated device.
     * @returns The simulated device information, or `null` if none is configured.
     */
    getDeviceInfo(): BleDeviceInfo | null {
        return this.deviceInfo;
    }

    /**
     * Simulates scanning for the configured BLE device.
     * @returns A list containing the simulated device, or an empty list if none is configured.
     */
    async scan(): Promise<BleDeviceInfo[]> {
        if(! this.deviceInfo){
            console.warn("MockBleAdapeter: scan() called but no simulated device has registerd its identity yet.")
            return[];
        }
        return[this.deviceInfo];
    }

    /**
     * Simulates connecting to a BLE device.
     * @param deviceId Identifier of the simulated device to connect to.
     * @throws If no device is configured or its identifier does not match.
     */
    async connect(deviceId: string): Promise<void> {
        if (!this.deviceInfo || deviceId !== this.deviceInfo.id) {
            throw new Error(`Mock BLE device with ID ${deviceId} not found.`);
        }
        this.connectedDeviceId = deviceId;
    }

    /**
     * Simulates disconnecting from a BLE device.
     * Notifies registered disconnection handlers when a device was connected.
     */
    async disconnect(): Promise<void> {
        const disconnectedDeviceId = this.connectedDeviceId;
        this.connectedDeviceId = null;
        if (disconnectedDeviceId) {
            this.disconnectListeners.forEach((listener) => listener(disconnectedDeviceId));
        }
    }

    /**
     * Simulates sending raw bytes to a BLE device.
     * @param data Bytes to deliver to the simulated device.
     * @throws If no device is connected.
     */
    async sendData(data: Uint8Array): Promise<void> {
        if (!this.connectedDeviceId) {
            throw new Error("Not connected to a BLE device.");
        }
        // Simulate sending data (in a real implementation, this would interact with the actual BLE device)
        console.log("MockAdapter: app sent datat to simulated device");
        if (!this.deviceReceiveCallback){
            console.error("MockBLEAdapter: No deviceReceiveCallback registered")
            return;
        }
        this.deviceReceiveCallback(data);
    }

    /**
     * Registers a callback to handle incoming data from the BLE device.
     * @param callback Handler invoked with simulated device-to-app bytes.
     */
    onDataReceived(callback: (data: Uint8Array) => void): void {
        this.recieveCallback = callback;
    }

    /**
     * Registers a handler for disconnections from the simulated device.
     * @param callback Handler invoked with the identifier of the disconnected device.
     * @returns A function that unregisters this handler.
     */
    onDisconnected(callback: (deviceId: string) => void): () => void {
        this.disconnectListeners.add(callback);
        return () => this.disconnectListeners.delete(callback);
    }

    /**
     * Registers a simulated device-side handler for bytes sent by the app.
     * @param callback Handler invoked when {@link sendData} is called.
     */
    onDeviceReceive(callback: (data: Uint8Array) => void): void {
        this.deviceReceiveCallback = callback;
    }

    /**
     * Checks whether the simulated device is connected.
     * @returns `true` if connected; otherwise, `false`.
     */
    isConnected(): boolean {
        return this.connectedDeviceId !== null;
    }

    /**
     * Returns the ID of the currently connected BLE device, or null if not connected.
     * @returns The connected device identifier, or `null` if disconnected.
     */
    getConnectedDeviceId(): string | null {
        return this.connectedDeviceId;
    }

    /**
     * Encodes a simulated device-to-app message and delivers it to the registered callback.
     * @param payloadField Name of the protobuf payload field to encode.
     * @param data Data to place in the payload.
     * Does nothing if the simulated device is disconnected or no receive handler is registered.
     */
    simulateIncomingData(payloadField: string, data: Record<string, unknown>): void {
        console.log("Simulating incoming data through the MockBleAdapter")
        if (!this.connectedDeviceId) {
            console.warn("Cannot simulate incoming data: Not connected to a BLE device.");
            return;
        }

        if (!this.recieveCallback) {
            console.warn("No callback registered to handle incoming data.");
            return;
        }

        const encoded = ProtobufService.encode("DeviceToApp", {[payloadField]: data})

        this.recieveCallback(encoded);
    }

}
