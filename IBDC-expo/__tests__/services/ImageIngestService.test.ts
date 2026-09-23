import { ImageChunk, PendingEventList, IBDCCommunicationService } from "@/services/IBDCCommunicationService"
import { SimulatedIBDC} from "@/ble/SimulatedIBDC";
import { MockBleAdapter} from "@/ble/MockBleAdapter";
import { ImageIngestService} from "@/services/ImageIngestService";

let mockBleAdapter: MockBleAdapter = new MockBleAdapter();
let ibdc: SimulatedIBDC = new SimulatedIBDC(mockBleAdapter);
let commsService: IBDCCommunicationService = new IBDCCommunicationService(mockBleAdapter);
let ingestService: ImageIngestService = new ImageIngestService(commsService);






