import * as net from 'net';
import * as protobuf from 'protobufjs';

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
initialize();


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
    console.log("Attempting to connect to " + hostname + ":" + port);
    let comms = net.createConnection(port, hostname, () => {
        console.log('Connected');
        if(send_status_update(comms)) {
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
function send_status_update(sock:net.Socket, wait?: number, ): boolean {
    protobuf.load("IBDC.proto", function (err, root) {
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
    console.log("Main function entered");
    const socket = initialize();
    if (!socket) {
        console.log("Initialization failed. Exiting.")
        process.exit(0);
    }
    // The program will now listen for messages from the mobile application and respond to them with data.
    let finished = false;
    while (!finished) {
        const message = socket.read();
    }



}

