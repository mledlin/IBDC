import { isColor } from "react-native-reanimated";
import {BleAdapter, BleDeviceInfo} from "../ble/BleAdapter";

export class MockBleAdapter implements BleAdapter {
    private readonly mockDeviceId: BleDeviceInfo = { id: "mock-IBDC-001", name: "Simulated IBDC" };

    private connectedDeviceId: string | null = null;

    private recieveCallback: ((data: Uint8Array) => void) | null = null;

    /**
     * Simulates scanning for nearby BLE devices.
     */
    async scan(): Promise<BleDeviceInfo[]> {
        return [this.mockDeviceId];
    }

    /**
     * Simulates connecting to a BLE device.
     */
    async connect(deviceId: string): Promise<void> {
        if (deviceId !== this.mockDeviceId.id) {
            throw new Error(`Mock BLE device with ID ${deviceId} not found.`);
        }
        this.connectedDeviceId = deviceId;
    }

    /**
     * Simulates disconnecting from a BLE device.
     */
    async disconnect(): Promise<void> {
        this.connectedDeviceId = null;
    }

    /**
     * Simulates sending raw bytes to a BLE device.
     */
    async sendData(data: Uint8Array): Promise<void> {
        if (!this.connectedDeviceId) {
            throw new Error("Not connected to a BLE device.");
        }
        // Simulate sending data (in a real implementation, this would interact with the actual BLE device)
        // send to simulated device when implemented. Reminder to self to change later.
        console.log(`Mock sending data to device ${this.connectedDeviceId}:`, data);
    }

    /**
     * Registers a callback to handle incoming data from the BLE device.
     */
    onDataReceived(callback: (data: Uint8Array) => void): void {
        this.recieveCallback = callback;
    }

    /**
     * Simulates receiving data from the BLE device.
     */
    isConnected(): boolean {
        return this.connectedDeviceId !== null;
    }

    /**
     * Returns the ID of the currently connected BLE device, or null if not connected.
     */
    getConnectedDeviceId(): string | null {
        return this.connectedDeviceId;
    }
}
