import { IBDCCommsToAppEndpointProvider } from "@/__tests__/factories/IBDCCommsToAppEndpointProvider";

const testing_environment: IBDCCommsToAppEndpointProvider = new IBDCCommsToAppEndpointProvider();


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
    await testing_environment.ibdc.triggerEvent();
    expect(testing_environment.imageIngestService.getPendingEventSize()).toEqual(1);

    // Pass in a malformed object and:
    // expect pendingEvents.At(eventID).toBe(error)
})

test("handleImageInfo", async () => {

})

test("handleImageChunk", async () => {

})

test("finishImage", async () => {

})












