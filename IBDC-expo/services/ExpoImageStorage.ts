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
        this.dir.create({intermediates: true, idempotent: true });
        const file = new File(this.dir, fileName);
        file.write(data);
        return file.uri;
    }

}

