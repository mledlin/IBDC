import React, { JSX } from "react";
import { DeviceProvider, DeviceDependencies } from "@/context/DeviceContext";
import { BleAdapter } from "@/ble/BleAdapter";
import { MockBleAdapter } from "@/ble/MockBleAdapter";
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { ImageIngestService } from "@/services/ImageIngestService";
import { ExpoImageStorage } from "@/services/ExpoImageStorage";
import { DAOAdapter } from "@/services/DAOAdapter";
import { SimulatedIBDCImageLoader } from "@/ble/SimulatedIBDCImageLoader"

/**
 * This file is responsible for constructing the components used in the production build. This class also provides the
 * context necessary for DeviceContext.
 */

//!!real adapter will be used in production, mock adapter is for testing and development
// kept as concrete MockBleRefrence because SimulatedIBDC needs simulateIncomming(),
// which isn't a part of the BleAdapter interface or the real implementation.
const mockBLEAdapter = new MockBleAdapter();
const bleAdapter: BleAdapter = mockBLEAdapter;

// Sits between bleAdapter and this context (and any other domain services),
const communicationService: IBDCCommunicationService = new IBDCCommunicationService(bleAdapter);

// Abstractions built around hardware coupling.
const imageStorage = new ExpoImageStorage();
const imageLoader = new SimulatedIBDCImageLoader();
const DAOAccess = new DAOAdapter();

const imageIngestService: ImageIngestService = new ImageIngestService(communicationService, imageStorage, DAOAccess);

const simulatedDevice = new SimulatedIBDC(mockBLEAdapter, imageLoader);

const deviceDependencies: DeviceDependencies = {
    bleAdapter,
    communicationService,
    simulatedDevice,
    imageIngestService,

};


export default function ProvideDependencies({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <DeviceProvider dependencies={deviceDependencies}>
            {children}
        </DeviceProvider>
    );
}