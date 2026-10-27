import {BleManager, Device, State, Subscription} from "react-native-ble-plx";
import { PermissionsAndroid, Platform, } from "react-native";
import { Buffer } from "buffer";
import { BleAdapter, BleDeviceInfo } from "./BleAdapter";

const SERVICE_UUID = "D4A51F4B-93EF-4AB1-B2B6-0E445CC297BA";
const RX_UUID = "D4A51F4C-93EF-4AB1-B2B6-0E445CC297BA";
const TX_UUID = "D4A51F4D-93EF-4AB1-B2B6-0E445CC297BA";
/** Duration of a device discovery scan, in milliseconds. */
const SCAN_DURATION_MS = 5000;

/**
 * BLE adapter backed by `react-native-ble-plx` for communication with IBDC hardware.
 *
 * Handles platform permissions, Bluetooth readiness, discovery, GATT setup, writes,
 * notifications, and transport of raw byte arrays.
 */
export class RealBleAdapter implements BleAdapter {
    private manager: BleManager; 
    private connectedDevice: Device | null = null; 
    private notificationSubscription: Subscription | null = null;
    private disconnectSubscription: Subscription | null = null;
    private disconnectListeners = new Set<(deviceId: string) => void>();

    private receiveCallback: 
        | ((data: Uint8Array) => void)
        | null = null;

    private scanTimeout: ReturnType<typeof setTimeout> | null = null; 

    private scanResolve: 
        | ((devices: BleDeviceInfo[]) => void)
        | null = null; 

    private scanReject: 
        | ((error: Error) => void) 
        | null = null;
    
    private discoveredDevices = new Map<string, BleDeviceInfo>();
    
    /** Creates a BLE manager used for hardware communication. */
    constructor() {
        this.manager = new BleManager();
    }

    /**
     * Requests the Bluetooth permissions required by the current platform.
     * @returns Whether the required permissions were granted.
     */
    private async requestPermissions(): Promise<boolean> {
        if(Platform.OS === "ios") {
            return true;
        }
        if(Platform.OS !== "android") {
            return false;
        }

        const apiLevel = typeof Platform.Version == "number" ? Platform.Version : parseInt(Platform.Version, 10);
        //Android 12 / API 31+
        if (apiLevel >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const scanGranted = result[
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        ] === PermissionsAndroid.RESULTS.GRANTED;

        const connectedGranted = result[
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ] === PermissionsAndroid.RESULTS.GRANTED;

        return(
            scanGranted && connectedGranted
        );
    }
    // for Andorid ll and below, BLE scanning requied location permission on these Android versions.
    const locationPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return (locationPermission === PermissionsAndroid.RESULTS.GRANTED);
    }

    /**
     * Scans for nearby devices advertising the IBDC service UUID.
     * Devices that do not advertise this service are not discovered.
     * @returns A promise that resolves with the devices found during the scan.
     * @throws If permissions are denied, Bluetooth is unavailable, or scanning fails.
     */
    async scan(): Promise<BleDeviceInfo[]> {
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted){
            throw new Error("BLE permission not granted");
        }
        await this.waitForBluetoothPoweredOn();
        //make sure an old scan is not running. 
        this.stopScan();
        this.discoveredDevices.clear();
        console.log("Starting BLE scan for IBDC devices...");
        return new Promise<BleDeviceInfo[]>((resolve, reject) => {
            this.scanResolve = resolve;
            this.scanReject = reject;
            this.manager.startDeviceScan(
                [SERVICE_UUID],
                null, 
                (error, device) => {
                    if (error) {
                        console.error("BLE scan error:", error);
                        this.failScan(error);
                        return;
                    }

                    if(!device){
                        return;
                    }
                    // if the Ble scan collects (scans) the same device more than once
                    // We use a map to remove any duplicates. 
                    const discoveredDevice: BleDeviceInfo = {
                        id: device.id, 
                        name: 
                            device.name ??
                            device.localName ??
                            "IBDC Device", 
                    };

                    this.discoveredDevices.set(
                        device.id, 
                        discoveredDevice
                    );

                    console.log("Found IBDC device:",
                         discoveredDevice
                        );
                }
            );
            // Scan duration is set here to timeout after SCAN_DURATION_MS
            // SCAN_DURATION_MS is set to 5 seconds. 
            this.scanTimeout = setTimeout(()=> {
               this.finishScan();
            }, SCAN_DURATION_MS);
        });
           
    }

    /**
     * Stops the current BLE scan, if the scan is waiting for the results,
     * the scan will return what it has discovered so far. 
     */
    stopScan(): void {
        this.manager.stopDeviceScan();
        if (this.scanTimeout){
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
        if(this.scanResolve){
            const devices = Array.from(this.discoveredDevices.values());
            const resolve = this.scanResolve; 
            this.clearScanState();
            resolve(devices);
        }
    }

    /** Clears the stored callbacks and timer for the current scan. */
    private clearScanState(): void {
        this.scanResolve = null; 
        this.scanReject = null;
        this.scanTimeout = null;
    }

    /**
     * Connects to a device, discovers its services, and enables its TX notifications.
     * @param deviceId Identifier of the device to connect to.
     * @throws If permissions are denied or the connection/setup fails.
     */
    async connect(deviceId: string): Promise<void>{
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted){
            throw new Error("BLE permission not granted.")
        }

        await this.waitForBluetoothPoweredOn();

        try {
            //stop scanning before trying to connect.
            this.stopScan();
            console.log("Attempting to connect to IBDC device:", deviceId);
            const device = await this.manager.connectToDevice(deviceId);
            console.log("BLE connection established.");
            //Both Android and iOS need service discovery after establishing the physical BLE connection. 
            const discoveredDevice = await device.discoverAllServicesAndCharacteristics();
            this.connectedDevice = discoveredDevice;
            console.log("IBDC services and characteristics discovered.")
            //listen for unexpected disconnections.
            this.setUpDisconnectListener();
            //subscribe to TX so the phone can revice messages from the IBDC deivce. 
            this.subscribeToTx();
            console.log("IBDC device fully connected:", deviceId);
        } catch (error) { 
            console.error("Failed to connect to IBDC deivce:", error);
            try{
                if(this.connectedDevice){
                    await this.manager.cancelDeviceConnection(
                        this.connectedDevice.id
                    );
                }
            }catch(error) {
                console.warn("Failed to clean up BLE connection:", error);
            }
            this.cleanUpCOnnectionState();
            throw error;
        }
    }

    /** Removes active subscriptions and clears the connected-device reference. */
    private cleanUpCOnnectionState(): void {
        this.notificationSubscription?.remove();
        this.notificationSubscription = null; 
        this.disconnectSubscription?.remove();
        this.disconnectSubscription = null;
        this.connectedDevice = null;
    }

    /**
     * Registers a handler for device disconnections.
     * @param callback Handler invoked with the identifier of the disconnected device.
     * @returns A function that unregisters this handler.
     */
    onDisconnected(callback: (deviceId: string) => void): () => void {
        this.disconnectListeners.add(callback);
        return () => this.disconnectListeners.delete(callback);
    }

    /** Notifies every registered listener that a device disconnected. */
    private notifyDisconnected(deviceId: string): void {
        this.disconnectListeners.forEach((listener) => listener(deviceId));
    }

    /**
     * Watches the connected device for an unexpected disconnection.
     */
    private setUpDisconnectListener(): void {
        if(!this.connectedDevice) {
            return;
        }
        this.disconnectSubscription?.remove();
        const deviceId = this.connectedDevice.id;
        this.disconnectSubscription = this.manager.onDeviceDisconnected(deviceId, 
            (error, device) => {
                if(error) {
                    console.warn("IBDC device disconnected.", error);
                } else {
                    console.log("IBDC deivce disconnected:", device?.id ?? deviceId);
                }
                this.cleanUpCOnnectionState();
                this.notifyDisconnected(deviceId);
            }
        );
    }

    /**
     * Stops notifications and disconnects from the connected device.
     * If no device is connected, any active scan is cancelled.
     * @returns A promise that resolves when the disconnect operation completes.
     * @throws If the platform fails to disconnect the device.
     */
    async disconnect(): Promise<void> {
        if(!this.connectedDevice){
            if (this.scanResolve || this.scanReject) {
                this.cancelScan(new Error("Scan cancelled because no BLE device was connected."));
            }
            return;
        }
        const deviceId = this.connectedDevice.id;
        console.log("Disconnecting from IBDC deivce:", deviceId);
        //stop listening for TX notifications.
        this.notificationSubscription?.remove();
        this.notificationSubscription = null; 
        //remove our disconnected listener before mannulally diconnecting. 
        this.disconnectSubscription?.remove();
        this.disconnectSubscription = null; 
        try{
            await this.manager.cancelDeviceConnection(deviceId);
            console.log("Disconnected from IBDC device:", deviceId);
        } catch (error) {
            console.error ("BLE disconnect error:", error);
            throw error;
        } finally {
            this.cleanUpCOnnectionState();
            this.notifyDisconnected(deviceId);
        }
    }

    /**
     * Sends raw bytes to the connected IBDC device.
     * `IBDCCommunicationService` is responsible for protobuf encoding before this call.
     * @param data Encoded bytes to transmit.
     * @returns A promise that resolves when the write completes.
     * @throws If no device is connected or the write fails.
     */
    async sendData(data: Uint8Array): Promise<void> {
       if(!this.connectedDevice) {
        throw new Error("Cannot send BLE data: no IBDC deivice connected.");
       }
       const base64String = Buffer.from(data).toString("base64");
       try {
        await this.connectedDevice.writeCharacteristicWithResponseForService(SERVICE_UUID, RX_UUID, base64String);
        console.log(`Sent ${data.length} BLE bytes to IBCD deivce.`);
       } catch (error){
        console.error("Failed to send BLE data:", error);
        throw error;
       }
    }
    
    /**
     * Registers the callback that receives bytes from the connected device.
     * @param callback Handler invoked with each received byte sequence.
     */
    onDataReceived(callback: (data: Uint8Array) => void): void {
        this.receiveCallback = callback;
    }

    /**
     * Checks whether an IBDC device is connected.
     * @returns `true` if connected; otherwise, `false`.
     */
    isConnected(): boolean {
        return (this.connectedDevice !== null);
    }

    /**
     * Gets the identifier of the currently connected device.
     * @returns The connected device identifier, or `null` if disconnected.
     */
    getConnectedDeviceId(): string | null {
        return this.connectedDevice?.id ?? null;
    }

    /** Subscribes to the device TX characteristic and forwards notification bytes. */
    private subscribeToTx(): void {
        if (!this.connectedDevice){
            throw new Error("Cannot subscribe to TX: no device connected.");
        }
        this.notificationSubscription?.remove();
        console.log("Subscribing to IBDC TX...");
        this.notificationSubscription = this.connectedDevice.monitorCharacteristicForService(SERVICE_UUID, TX_UUID, 
            (error, characteristic) => {
                if(error) {
                    console.error("Tx notification error:", error); 
                    return;
                }
                if(!characteristic?.value){
                    return;
                }
                const buffer = Buffer.from(characteristic.value, "base64");
                const bytes = new Uint8Array(buffer);
                console.log(`Received ${bytes.length} BLE bytes`);

                if (!this.receiveCallback){
                    console.warn("Recieved BLE data, but no OnDataReceived listener is registered.");
                    return;
                }

                this.receiveCallback(bytes);
            }
        );
    }

    /**
     * Completes the active scan successfully and resolves it with discovered devices.
     */
    private finishScan(): void {
        this.manager.stopDeviceScan();
        if(this.scanTimeout){
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
        const devices = Array.from(this.discoveredDevices.values());
        console.log(`Ble Scan finished. FOund ${devices.length} device(s).`);
        const resolve = this.scanResolve;
        this.clearScanState();
        this.discoveredDevices.clear();
        resolve?.(devices);
    }

    /** Stops an active scan and rejects its promise after a scan error. */
    private failScan(error: Error): void {
        this.manager.stopDeviceScan();
        if(this.scanTimeout){
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
        const reject = this.scanReject;
        this.clearScanState();
        reject?.(error);
    }

    /** Stops an active scan and rejects its promise with the cancellation reason. */
    private cancelScan(error: Error): void {
        if (!this.scanResolve && !this.scanReject) {
            return;
        }

        this.manager.stopDeviceScan();
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }

        const reject = this.scanReject;
        this.clearScanState();
        this.discoveredDevices.clear();
        reject?.(error);
    }

    /**
     * Waits until Bluetooth is powered on before starting BLE operations.
     * CoreBluetooth may not be ready immediately after the manager starts.
     * @returns A promise that resolves when Bluetooth is ready.
     * @throws If Bluetooth enters an unavailable state.
     */
    private async waitForBluetoothPoweredOn(): Promise<void> {
        const currentState = await this.manager.state();
        if(currentState === State.PoweredOn) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            const subscription = this.manager.onStateChange(
                (state) => {
                    if(state === State.PoweredOn){
                        subscription.remove();
                        resolve();
                    }

                    if(
                        state === State.PoweredOff ||
                        state === State.Unsupported || 
                        state === State.Unauthorized
                    ) {
                        subscription.remove();
                        reject(new Error(`Bluetooth unavailable: Current State: ${state}`));
                    }
                }, 
                true
            );
        });
    }
}