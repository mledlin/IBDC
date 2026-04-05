import * as protobuf from 'protobufjs';
import { BleManager } from 'react-native-ble-plx'

/**
 * Task# 101 Validate incoming protobuf messages
 * To Do:
 * 1. De-serialize/serialize message
 * 2. Check message for required fields
 * 3. Store message in a JavaScript Object
 * 4. Log any errors or un-expected errors
 *
 */

var messages = require('../Resources/IBDC_pb');
var deviceStatus = new messages.DeviceStatus();
deviceStatus.setBatteryPercent(50);
deviceStatus.setProtocolVersion(2);
deviceStatus.setPendingEvents(10);
deviceStatus.setStorageAvailablePercent(35);
console.log(deviceStatus.serializeBinary()); // This is what would be sent over the wire

console.log();
/**
 *
 * @param message parsed message from over the wire
 */
function validateMessage(): boolean {

}

/**
 * This function asks the user what type of message
 */
function serializeData(): Object {
    // Ask the user which message to serialize
    // Valid messages to receive: [EventNotification, ImageChunk, DeviceStatus, PendingEventList]

}