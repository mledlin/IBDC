import { ImageChunk, PendingEventList, IBDCCommunicationService  } from "@/services/IBDCCommunicationService"
import { SimulatedIBDC } from "@/ble/SimulatedIBDC";
import { MockBleAdapter } from "@/ble/MockBleAdapter";
import { ImageIngestService, ImageStorage, DAOAccessor } from "@/services/ImageIngestService";

// Objects defined at file level for each test function to reference
let mockBleAdapter: MockBleAdapter;
let ibdc: SimulatedIBDC;
let commsService: IBDCCommunicationService;
// Define mock data base and image storage
// Mock image store
let storage: Map<string, Uint8Array>;
let ingestService: ImageIngestService;

let DAOaccessor: DAOAccessor;
// Test the image with specified name is written with the correct bytes
let imageStorage: ImageStorage;

// Instantiate each object before testing
beforeAll(async () => {
    console.log("working in BeforeAll")
    mockBleAdapter = new MockBleAdapter();
    ibdc = new SimulatedIBDC(mockBleAdapter);
    commsService = new IBDCCommunicationService(mockBleAdapter);
    storage = new Map<string, Uint8Array>
    imageStorage = { saveImage: jest.fn((fileName: string, data: Uint8Array): string => {
        storage.set(fileName, data);
        return fileName;
    })}
    // Doesn't test actual DAO access or success status, only ensure the passed in values are correct
    DAOaccessor = {
        createSession: (sessionId: string, createdTime: string) => {
            return Promise.resolve();
        },
        createIncident: (id: string,
                         sessionId: string,
                         latitude: number | null,
                         longitude: number | null,
                         licensePlate: string | null,
                         bestImageId: string | null,
                         injurySeverity: string | null,
                         driverPresent: number,
                         driverInformation: string | null,
                         extraComment: string | null,
                         vehicleMake: string | null,
                         vehicleModel: string | null,
                         vehicleColor: string | null,
                         vehicleYear: string | null,
                         createdTime: string) => {
            return Promise.resolve();
        },
        createIncidentImage: (id: string,
                              incidentId: string,
                              filePath: string,
                              thumbnail: any,
                              source: string) =>  {
            return Promise.resolve();
        }
    }
    ingestService = new ImageIngestService(commsService, imageStorage, DAOaccessor);
})


test("handleEventNotification", async () => {
    // Pass in correct object and:
    // expect pendingEvents.At(eventID).toBe(defined)
    // expect pendingEvents.At(eventID).toEqual(the object passed in)
    console.log("Testing handleEventNotification");
    const eventID: number = 1;
    let pendingEvent = {
        imageCount: 2,
        detectedAt: new Date().toISOString(),
        images:  new Map<number, {
            totalChunks: number;
            imageFormat?: string;
            chunks: Map<number, Uint8Array>;
        }>,
        imagePaths: new Map<number,string>
    }
    await ibdc.triggerEvent()


    // Pass in a malformed object and:
    // expect pendingEvents.At(eventID).toBe(error)



})

test("handleImageInfo", async () => {

})

test("handleImageChunk", async () => {

})

test("finishImage", async () => {

})












