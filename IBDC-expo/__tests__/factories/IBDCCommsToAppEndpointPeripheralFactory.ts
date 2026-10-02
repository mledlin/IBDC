// This factory class creates customizable peripherals that replace hardware production dependencies.
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { LoadImageData, SimulatedIBDCImageLoader } from "@/ble/SimulatedIBDCImageLoader";
import { ImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "@/services/DAOAdapter";
import { ImageIngestService } from "@/services/ImageIngestService";




class IBDCCommsToAppEndpointPeripheralFactory {


    constructor() {}

    // Allow the programmer to inject their own implementation
    public createSimulatedIbdc(imageLoader?: LoadImageData): SimulatedIBDC {

    }

    // Allow the programmer to inject their own implementation
    public createImageIngestService(storage?: ImageStorage, adapter?: DAOAdapter ): ImageIngestService {

    }



}



