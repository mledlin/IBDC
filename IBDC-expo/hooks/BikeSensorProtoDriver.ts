import * as net from 'net';
import * as protobuf from 'protobufjs';
import * as readline from 'readline-sync'

// Load arguments from command line
/*const args = process.argv.slice(2);
let port: number = 8000;
let host: string = 'localhost';

if (args.length === 2) {
    console.log('Arguments passed:', args);
    // Access specific arguments by index
     port = Number(args[0]);
     host = args[1];
     console.log(`Using values of port: host:'`);
}
else console.log('Using default values of host:localhost port:8000');

    let socket = net.createConnection(port, host, () => {
    proto_testing_loop(socket);
    }).on("error", (err) => {
        console.log("Something is wrong");
        console.log(err);
    })
*/

//proto_testing_loop();
main();


function proto_testing_loop (socket?: net.Socket)
{
// This code is sourced from https://protobufjs.github.io/protobuf.js/#installation
// This code is a modified version of the code found at the website above.
    protobuf.load("IBDC.proto", function (err, root) {
        if (err)
            throw err;

        if (root) { // Not sure if this is safe
            // Obtain a message type
            let AwesomeMessage = root.lookupType("IBDC.Settings");
            console.log(AwesomeMessage.toJSON())

            // Exemplary payload
            let payload = {
                images_per_event: 100
            }

            // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
            let errMsg = AwesomeMessage.verify(payload);
            console.log(errMsg)

            if (errMsg)
                throw Error(errMsg);

            // Create a new message
            let message = AwesomeMessage.create(payload);// or use .fromObject if conversion is necessary


            // Encode a message to an Uint8Array (browser) or Buffer (node)
            let buffer = AwesomeMessage.encode(message).finish();

            // ... do something with buffer
            //socket.write(buffer);
            // Decode an Uint8Array (browser) or Buffer (node) to a message
            //let message = AwesomeMessage.decode(buffer);
            // ... do something with message

            // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

            // Maybe convert the message back to a plain object
            let object = AwesomeMessage.toObject(message, {
                longs: String,
                enums: String,
                bytes: String,
                // see ConversionOptions
            });
        }
    });
}

/*
@initialize initialize a connection to the device, send an initial status update and locate the .proto file
@PARAMS
@PARAM port: port to connect to
@PARAM hostname: host to connect to (IP ADDRESS)
@PARAM attempts: number of times a re-initialization should occur
 */
function initialize(port: number = 8000, hostname: string = 'localhost', attempts?: number): net.Socket {
    //console.log("Attempting to connect to " + hostname + ":" + port);
    let comms = net.createConnection(port, hostname, () => {
        console.log('Connected');
        if(send_device_status(comms)) {
            console.log('Sent status update to mobile application');
        } else {
            console.log('Message was not sent over the wire for some reason.');
        }
    }).on('error', (err) => {
        console.log(err);
    });
    return comms;
}

// Send protobuf message to user phone and wait x time for a response
// RETURNS true if message was sent over the wire. NO guarantees the message reaches the destination, only that it was sent
function send_device_status(sock:net.Socket, wait?: number, ): boolean {
    protobuf.loadSync("../Resources/IBDC.proto", function (err, root) {
        if (err)
            throw err;

        if (root) { // Not sure if this is safe
            // Obtain a message type
            let AwesomeMessage = root.lookupType("IBDC.DeviceStatus");
            console.log(AwesomeMessage.toJSON())

            // Exemplary payload
            let payload = {
                protocol_version: 1, // protocol version for future changes and compatibility
                battery_percent: 87, // battery percentage (0-100)
                pending_events: 0, // number of pending events (not transmitted yet)
                storage_available_percent: 100, // available storage percentage (0-100)
            }

            // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
            let errMsg = AwesomeMessage.verify(payload);
            console.log(errMsg)

            if (errMsg)
                throw Error(errMsg);

            // Create a new message
            let message = AwesomeMessage.create(payload);// or use .fromObject if conversion is necessary


            // Encode a message to an Uint8Array (browser) or Buffer (node)
            let buffer = AwesomeMessage.encode(message).finish();
            if(sock.write(buffer)) {
                return true;
            }
        }
    })
    return false;
}

// The main function encapsulates all the logic required from when the IBDC sensor connects to the mobile application
// via bluetooth.
function main() {
    const socket: net.Socket = initialize();
    if (!socket) {
        console.log("Initialization failed. Exiting.")
        process.exit(0);
    }
    // The program will now listen for messages from the mobile application and respond to them with data.
    // Communications loops
    // 1. Add buffer from console to messages
    // 2. Read buffer from socket to messages
    // 3. While the message buffer is > 0
    // 4. Parse message and send data back to the phone over the socket
    // 5. Repeat until bluetooth connection is dropped
    let connected:booleean = true;
    let messages: string[] = [];
    const valid_messages: string[] = ['EventNotification', 'ImageChunk', 'DeviceStatus', ''];
    while (connected) {
        // Read the bytes from over the wire and store them as a string in messages array
        const mobile_listener: string = socket.read();
        if (mobile_listener) { // If there is a data sent from the phone, add it to the message buffer
            messages.push(mobile_listener);
        }

        // Prompt user to enter a valid sendable message
        console.log('Embedded Message Types:\n' +
            'EventNotification\n' +
            'ImageChunk\n' +
            'DeviceStatus\n');
        const embeddedEventNotification: string = readline.question('Enter an embedded message type or enter nothing to end the connection.\n');
        messages.push(embeddedEventNotification);
        console.log();

        console.log("Received messages:");
        for (const message of messages) {
            console.log(`Message -> ${message}`);
        }
        console.log();
    }
        // Handle all the messages in the buffer
    // Loop and do this forever until the connection is lost or indicated to stop via the console

}


/*
## The ProtoDriver Module  (Work in Progress)
The ProtoDriver Module allows message passing via Protobuf over a network. This module can be used as a way to model the
way the IBDC Bike Sensor communicates with the mobile application. This driver will be able to receive signals
meant for the IBDC Bike Sensor from both the embedded system(modeled as console inputs) and messages from the mobile application.
This module can be used for testing the serialization of data between the devices and the logic required in both devices
based on this communication.

## How to use the ProtoDriver Module (Phase 1)
    - Once the BikeSensorProtoDriver.ts is started, the script will automatically conncect to localhost::8000. The driver
    will send a DeviceStatus message to the device. To verify the program connects to a host listening on a port on localhost,
    use this command in the terminal to send a listener to localhost::8000 (I'm on Mac so I'm not sure if this will work for everyone)
     -> nc -l -p 8000


## To Dos
    - Program the ability to allow console input in order to mimic embedded messages from the IBDC sensor
    - Deserialize messages from over the wire
    - Serialize and send messages based on a message from the mobile application or console input
    - Architect a better control flow for the program. It's kind of rough right now, but it's going in the right direction.


## Information Sources

     https://protobuf.dev/programming-guides/proto3/
        -Explains the rules and syntax for our version of Protobuf.

    https://www.npmjs.com/package/protobufjs#valid-message
        Explains how to download the Protobuf package and it's dependencies.
        Also contains a guide on how to use the library in different ways.
        This is where I copy and pasted the code I cited in the BikeSensorProtoDriver.ts file.
 */
