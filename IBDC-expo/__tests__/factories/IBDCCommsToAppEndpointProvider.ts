// This class creates customizable peripherals that replace hardware production dependencies.
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { LoadImageData } from "@/ble/SimulatedIBDCImageLoader";
import { ImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "@/services/DAOAdapter";
import { ImageIngestService } from "@/services/ImageIngestService";
import { MockBleAdapter } from "@/ble/MockBleAdapter"
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";


import { createMockImageStorage } from "@/__tests__/services/MockImageStorage";
import { createMockImageLoader } from "@/__tests__/ble/MockIBDCImageLoader";
import { createMockDAO }  from "@/__tests__/services/MockDAOAdapter"

import  { BleDeviceInfo } from "@/ble/BleAdapter";


export class IBDCCommsToAppEndpointProvider {

    // Same components used in production
    public bleAdapter: MockBleAdapter;
    public ibdc: SimulatedIBDC;
    public imageIngestService: ImageIngestService;
    public ibdcCommsService: IBDCCommunicationService;
    // ------------------------------------------------

    // Newly created abstractions injected into the above components, allowing for testing.
    public daoAdapter: DAOAdapter;
    public imageStorage: ImageStorage;
    public imageLoader: LoadImageData;
    // -----------------------------------



    constructor() {
    const  deviceInfo: BleDeviceInfo | null = {
            id: "device",
            name: "test_mock"
        }
        this.bleAdapter = new MockBleAdapter();
        this.bleAdapter.setDeviceInfo(deviceInfo)
        this.bleAdapter.connect(deviceInfo.id).then(() => {})
        this.ibdcCommsService = new IBDCCommunicationService(this.bleAdapter);
        this.daoAdapter = createMockDAO();
        this.imageStorage = createMockImageStorage();
        this.imageLoader = createMockImageLoader()
        this.ibdc = new SimulatedIBDC(this.bleAdapter, this.imageLoader)
        this.imageIngestService = new ImageIngestService(this.ibdcCommsService, this.imageStorage, this.daoAdapter)


    }

    public triggerEvent() {
        this.ibdc.triggerEvent();
    }

    // More public methods could be declared here to help with testing




}



