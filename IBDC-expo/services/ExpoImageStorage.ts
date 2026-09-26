import {Directory, File, Paths} from "expo-file-system";
import { ImageStorage, ImageIngestService } from "@/services/ImageIngestService"
import { IBDCCommunicationService } from "@/services/IBDCCommunicationService";
import {BleAdapter} from "@/ble/BleAdapter";

export class ExpoImageStorage implements ImageStorage {
    // The place images are stored to
    private readonly dir: Directory;


    constructor() {
        this.dir = new Directory(Paths.document, "incident_images");
    }

    public saveImage(fileName: string, data: Uint8Array): string {
        // Change this code
        // makes this safe to call on every image, not just the first.
        try {
            this.dir.create({intermediates: true, idempotent: true });
        } catch(error) {
            console.error("ImageIngestService: failed to create incident_images directory:", error);
        }

        const file = new File(this.dir, fileName);
        file.write(data);
        return file.uri;
    }

}

