import * as protobuf from "protobufjs";
import schema from "./IBDC_v0.2.1.json";

const root = protobuf.Root.fromJSON(schema);

// This class provides methods to encode and decode Protobuf messages based on the IBDC schema.
// It validates the data against the schema before encoding and decoding, ensuring that the messages conform to the expected structure.

export class ProtobufService {
    /**
     * Encodes a JavaScript object into a Protobuf binary format based on the specified message type.
     */
    static encode(
        messageType: string, 
        data:Record<string, unknown>
    ): Uint8Array {
        const type = root.lookupType(`IBDC.${messageType}`);
        const errMsg = type.verify(data);
        if (errMsg) {
            throw new Error(
                `Invalid ${messageType} protobuf message: ${errMsg}`
            );
        }
        const message = type.create(data);
        return type.encode(message).finish();
    }

    /**
     * Decodes a Protobuf binary format into a JavaScript object based on the specified message type.
     * 
    */
    static decode(
        messageType: string, 
        data: Uint8Array
    ): Record<string, unknown> {
        const type = root.lookupType(`IBDC.${messageType}`);
        const message = type.decode(data);
        return type.toObject(message, {
            longs: String,
            enums: String,
            bytes: Uint8Array,
            defaults: true, 
        });
    }
}