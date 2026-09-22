import {BleManager, Device, Subscription} from "react-native-ble-plx";
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

    private receiveCalback: 
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

    /**
     * Scans for nearby IBDC devices. 
     * 
     * This scan is filtering using the IBDC service UUID. 
     * This also means that if the deivce doesn't advertize this SERIVCE_UUID, 
     * the app will not be able to discover it.  
     */
    async scan(): Promise<BleDeviceInfo[]> {
       // this.stopScan();
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
                       // this.failscan(error);
                        return;
                    }

                    if(!device){
                        return;
                    }

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

            this.scanTimeout = setTimeout(()=> {
               // this.finishScan();
            }, SCAN_DURATION_MS);
        });
           
    }

    async connect(deviceId: string): Promise<void>{

    }

    async disconnect(): Promise<void> {
        
    }

    async sendData(data: Uint8Array): Promise<void> {
        
    }
    
    onDataReceived(callback: (data: Uint8Array) => void): void {
        
    }

    isConnected(): boolean {
        return true;
    }

    getConnectedDeviceId(): string | null {
        return this.connectedDevice?.id ?? null;
    }

    private subscribeToTx(): void {

    }
}