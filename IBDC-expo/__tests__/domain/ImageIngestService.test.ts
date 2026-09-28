import { ImageStorage } from "@/services/ImageIngestService";
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";

/**
 * export interface ImageStorage {
 *     // Returns the name of the file
 *     saveImage: (fileName: string, data: Uint8Array) => string,
 * }
 */

class MockImageStore implements ImageStorage {
    // Mocks <AbsoluteUri, ImagePixelData>
    private storage: Map<string, Uint8Array>;


    constructor() {
        this.storage = new Map();
    }

    public saveImage(fileName: string, data: Uint8Array): string {
        this.storage.set(fileName, data);
        return fileName;
    }
}


