// This factory class creates customizable peripherals that replace hardware production dependencies.
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { LoadImageData, SimulatedIBDCImageLoader } from "@/ble/SimulatedIBDCImageLoader";
import { ImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "@/services/DAOAdapter";
import { ImageIngestService } from "@/services/ImageIngestService";
import { MockBleAdapter } from "@/ble/MockBleAdapter"
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";

import { createMockImageStorage } from "@/__tests__/services/MockImageStorage";
import { createMockImageLoader } from "@/__tests__/ble/MockIBDCImageLoader";
import { createMockDAO }  from "@/__tests__/services/MockDAOAdapter"


export class IBDCCommsToAppEndpointProvider {

    private bleAdapter: MockBleAdapter;

    private daoAdapter: DAOAdapter;
    private imageStorage: ImageStorage;
    private ibdcCommsService: IBDCCommunicationService;
    private imageLoader: LoadImageData;

    private ibdc: SimulatedIBDC;
    private imageIngestService: ImageIngestService;

    constructor() {
        this.bleAdapter = new MockBleAdapter();
        this.ibdcCommsService = new IBDCCommunicationService(this.bleAdapter);
        this.daoAdapter = createMockDAO();
        this.imageStorage = createMockImageStorage();
        this.imageLoader = createMockImageLoader()
        this.ibdc = new SimulatedIBDC(this.bleAdapter, this.imageLoader)
        this.imageIngestService = new ImageIngestService(this.ibdcCommsService, this.imageStorage, this.daoAdapter)
    }




}



