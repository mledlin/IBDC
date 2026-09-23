import {BleManager, Device, State, Subscription} from "react-native-ble-plx";
import { PermissionsAndroid, Platform, } from "react-native";
import { Buffer } from "buffer";
import { BleAdapter, BleDeviceInfo } from "./BleAdapter";

const SERVICE_UUID = "D4A51F4B-93EF-4AB1-B2B6-0E445CC297BA";
const RX_UUID = "D4A51F4C-93Ef-4AB1-B2B6-0E445CC297BA";
const TX_UUID = "D4A51F4D-93EF-4AB1-B2B6-0E445CC297BA";

const SCAN_DURATION_MS = 5000;

export class RealBleAdapter implements BleAdapter {
    private manager: BleManager; 
    private connectedDevice: Device | null = null; 
    private notificationSubscription: Subscription | null = null;
    private disconnectSubscription: Subscription | null = null;

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
    
    constructor() {
        this.manager = new BleManager();
    }

    private async requestPermissions(): Promise<boolean> {
        if(Platform.OS == "ios") {
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
     * Scans for nearby IBDC devices. 
     * 
     * This scan is filtering using the IBDC service UUID. 
     * This also means that if the deivce doesn't advertize this SERIVCE_UUID, 
     * the app will not be able to discover it.  
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

    /**
     * Reset the internal scan bookeeping. 
     */
    private clearScanState(): void {
        this.scanResolve = null; 
        this.scanReject = null;
        this.scanTimeout = null;
    }

    /**
     * Connects to a specific BLE device.
     */
    async connect(deviceId: string): Promise<void>{
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
            this.connectedDevice = null; 
            this.cancelScan(error instanceof Error ? error: new Error ("BLE connection failed."));
            throw error;
        }
    }

    /**
     * Watches the device for sudden disconnection. 
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
                this.notificationSubscription?.remove();
                this.notificationSubscription = null;
                this.connectedDevice = null;

                if(this.scanResolve){
                    this.cancelScan(new Error("Scan cancelled becasue the device disconnected"))
                }
            }
        );
    }

    /**
     * Stop listening to TX notifications.
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
            this.connectedDevice = null; 
        }
    }

    /**
     * send raw bytes to the IBDC device.
     * Note: IBDCCommunicationService is responsible for 
     * the protobuff encoding BEFORE this method. 
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
     * Register the callback that recieves data coming from the IBDC device. 
     */
    onDataReceived(callback: (data: Uint8Array) => void): void {
        this.receiveCallback = callback;
    }

    /**
     * Returns wheather an IBDC device is connected. 
     */
    isConnected(): boolean {
        return (this.connectedDevice !== null);
    }

    /**
     * 
     * @returns 
     */
    getConnectedDeviceId(): string | null {
        return this.connectedDevice?.id ?? null;
    }

    /**
     * 
     */
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
                    console.warn("Recieved BLE data, but no OnDataRecieved listener is registered.");
                    return;
                }

                this.receiveCallback?.(bytes);
            }
        );
    }

    /**
     * Finish a sucessfull scan (happy case)
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
        resolve?.(devices);
    }

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
     * iOS-Specific. Waits for Bluetooth to actually become ready before scanning. 
     * CoreBluetooth may not be immediately powered on with BLE manager starts.
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