import { IBDCCommsToAppEndpointProvider } from "@/__tests__/factories/IBDCCommsToAppEndpointProvider";
import { EventNotification, ImageChunk, ImageInfo } from "@/services/IBDCCommunicationService";

const testing_environment: IBDCCommsToAppEndpointProvider = new IBDCCommsToAppEndpointProvider();

test("mapIncomingImagesToEventById", async () => {

    const eventPromise = new Promise<EventNotification>((resolve) => {
        testing_environment.ibdcCommsService.onEventNotifications(
            (message: EventNotification) => {
                resolve(message);
            }
        );
    });


    // Trigger after registering listeners
    testing_environment.triggerEvent();

    // Current event and imageInfo objects. These are passed to the ImageIngestService
    let [event] = await Promise.all([
        eventPromise
    ]);

    let ingestService_event_list = testing_environment.imageIngestService.getPendingEvents();

    // New event was created inside imageIngestService
    expect(ingestService_event_list.size).toBe(1);

    // The new event created in ImageIngestService has the same Id
    expect(ingestService_event_list.get(event.eventId)).toBeDefined();

    // The event is processed with the same amount of images that were sent
    expect(ingestService_event_list.get(event.eventId)?.imageCount).toBe(event.imageCount);


});


test("imageValidatedBeforeDAOWrite", async () => {

    const eventPromise = new Promise<EventNotification>((resolve) => {
        testing_environment.ibdcCommsService.onEventNotifications(
            (message: EventNotification) => {
                resolve(message);
            }
        );
    });


    testing_environment.triggerEvent();

    // Current event and imageInfo objects. These are passed to the ImageIngestService
    let [event] = await Promise.all([
        eventPromise,
    ]);

    let daoAdapter = testing_environment.daoAdapter;

    // To validate the images before writing to the file, these have to be true:
    // The ImageIngestService must receive all the chunks sent with the image

    await testing_environment.ibdcCommsService.sendEventTransferAck(event.eventId);

    expect(daoAdapter.createSession).toHaveBeenCalledTimes(1);
    expect(daoAdapter.createIncident).toHaveBeenCalledTimes(1);
    expect(daoAdapter.createIncidentImage).toHaveBeenCalledTimes(event.imageCount);

})

test("imageCompletionOnDisconnect", async () => {
    // Capture first imageChunk
    const chunkPromise = new Promise<ImageChunk>((resolve) => {
        testing_environment.ibdcCommsService.onImageChunk(
            (message: ImageChunk) => {
                resolve(message);
            })
    });

    const eventPromise = new Promise<EventNotification>((resolve) => {
        testing_environment.ibdcCommsService.onEventNotifications(
            (message: EventNotification) => {
                resolve(message);
            }
        );
    });

    const imageInfoPromise = new Promise<ImageInfo>((resolve) => {
        testing_environment.ibdcCommsService.onImageInfo(
            (message: ImageInfo) => {
                resolve(message);
            }
        )
    })
    // Trigger an event and wait for chunk to be received
    testing_environment.triggerEvent();

    // Await on the first chunk received
    let [imageChunk, imageInfo, event] = await Promise.all([
        chunkPromise,
        imageInfoPromise,
        eventPromise
    ])

    console.log("Total bytes in each image: " + imageInfo.imageSizeBytes);
    console.log("Total chunks in each image: " + Math.ceil(imageInfo.imageSizeBytes / 180));

    expect(imageChunk.chunkSequence).toBe(0);

    // Disconnect device
    testing_environment.disconnect();

    testing_environment.triggerEvent();


    console.log("Number of events being processed after" +
    "disconnect " + testing_environment.imageIngestService.getPendingEventSize());

    expect(testing_environment.imageIngestService.getPendingEventSize()).toBe(1);

    // Re-connect device
    testing_environment.reconnect();

    expect(testing_environment.imageIngestService.getPendingEventSize()).toBe(2);

    // Await next received chunk. It should be the second chunk in the last sent image
    [imageChunk] = await Promise.all([
        chunkPromise
    ])

    expect(imageChunk.chunkSequence).toBe(1);

})












