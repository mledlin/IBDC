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

    const imageInfoPromise = new Promise<ImageInfo>((resolve) => {
        testing_environment.ibdcCommsService.onImageInfo(
            (message: ImageInfo) => {
                resolve(message);
            }
        );
    });

    // Trigger after registering listeners
    testing_environment.triggerEvent();

    // Current event and imageInfo objects. These are passed to the ImageIngestService
    const [event, imageInfo] = await Promise.all([
        eventPromise,
        imageInfoPromise
    ]);

    expect(testing_environment.imageIngestService.getPendingEventSize()).toBe(1);
    expect(testing_environment.imageIngestService.getPendingEvents().get(event.eventId)).toBeDefined();
    // @ts-ignore able to ignore because in this scenario, there should always be three images
    expect(testing_environment.imageIngestService.getPendingEvents().get(event.eventId).images.size).toBe(3);
});

test("handleImageChunk", async () => {

})

test("finishImage", async () => {

})












