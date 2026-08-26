/**
 * Defines the BLE communication contract used by the application
 */

/**
 * BLE device shown during device pairing.
 */
export type BLEDevice = {
    id: string;
    name: string;
};

/**
 * Protobuf DeviceStatus message.
 */
export type DeviceStatus = {
    protocolVersion: number;
    batteryPercent: number;
    pendingEvents: number;
    storageAvailablePercent: number;
};

/**
 * Protobuf ImageFormat enum.
 */
export enum ImageFormat {
    JPEG = 0,
    PNG = 1,
}

/**
 * Protobuf EventNotification message.
 */
export type EventNotification = {
    eventId: number;
    distanceCm: number;
    timeOffset: number;
    imageCount: number;
    imageFormat: ImageFormat;
};

/**
 * Protobuf ImageChunk message.
 */
export type ImageChunk = {
    eventId: number;
    imageIndex: number;
    chunkSequence: number;
    isLastChunk: boolean;
    payload: Uint8Array;
};

/**
 * Protobuf ImageTransferRequest message.
 */
export type ImageTransferRequest = {
    eventId: number;
    startFromImage: number;
    startFromChunk: number;
};

/**
 * BLE interface for the application.
 *
 * MockBleAdapter will implement this interface.
 * A real BLE adapter can hopefully implement the same interface later.
 */
export interface BLEAdapter {
    // Connection Management
    scanForDevices(): Promise<BLEDevice[]>;
    connect(deviceId: string): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    // Device Communications
    readDeviceStatus(): Promise<DeviceStatus>;
    sendSettings(imagesPerEvent: number): Promise<void>;
    requestPendingEvents(): Promise<number[]>;
    requestEventInfo(eventId: number): Promise<EventNotification>;
    requestImageTransfer(request: ImageTransferRequest): Promise<void>;

    // Message Pushes From Device
    onEventNotification(listener: (event: EventNotification) => void,): () => void;
    onImageChunk(listener: (imageChunk: ImageChunk) => void,): () => void;
}