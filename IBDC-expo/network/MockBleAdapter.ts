import { ImageFormat } from './BleAdapter';
import type {
    BLEAdapter,
    BLEDevice,
    DeviceStatus,
    EventNotification,
    ImageChunk,
} from './BleAdapter';

/**
 * Simulates an IBDC device so the application can be developed without
 * needing functional BLE signals.
 */
export class MockBLEAdapter implements BLEAdapter {
    // Set vars

    // Connect
    async connect(deviceId: string): Promise<void> {
        // connect code
    }

    // Disconnect
    async disconnect(): Promise<void> {
        // disconnect code
    }

    // isConnected
    isConnected(): boolean {
        // return status data
    }

    // Device Status
    async readDeviceStatus(): Promise<DeviceStatus> {
        // Get device status
    }

    // Send Settings
    async sendSettings(imagesPerEvent: number): Promise<void> {
        // Update settings
    }

    // Get Events
    async requestPendingEvents(): Promise<number[]> {
        // get events from device
    }

    // get Event Info
    async requestEventInfo(eventId: number): Promise<EventNotification> {
        // Get event info
    }

    // Get Images
    async requestImageTransfer(request: ImageTransferRequest): Promise<void> {

    }

    // Listener for events
    onEventNotification() // Notify
    onImageChunk() // Handle new ImageChunk
}
