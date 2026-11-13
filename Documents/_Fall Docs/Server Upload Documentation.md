# IBDC Server Upload Documentation

## Overview

The server upload functionality was implemented to allow the IBDC application to send locally stored ride session data to an external server. The implementation is structured around an upload service and an adapter, separating the actual transfer of data from how that data is formatted.

This was done to allow for easier integration with the server team, as the expected data structure may change depending on how their database and API are implemented.

Currently, the system supports JSON uploads for session information, as well as multipart uploads for sessions containing images. A local test server was also created to verify that data is being properly sent and received.

## File Structure

The main files involved are:

- `utils/DataUpload.ts` – Handles the HTTP request and transfer of data.
- `utils/ServerUploadAdapter.ts` – Handles converting local session data into the format expected by the server.
- `utils/TestServer.js` – Local server used for testing.
- `utils/ImageConverter.ts` – Handles converting images into JPEG format where needed.
- `app/Settings.tsx` – Contains the test server upload button.

## Data Upload

The main functionality is handled through `DataUpload.ts`.

The upload service accepts a ride session and a configuration containing the server endpoint, optional headers, and an optional adapter.

```
type DataUploadConfig = {
    endpoint: string;
    headers?: Record<string, string>;
    adapter?: ServerUploadAdapter;
};
```

When an upload is requested, the service first passes the session through the selected adapter. If no adapter is provided, the default adapter is used.

The adapter returns the session metadata along with any files that need to be uploaded.

Depending on whether files are included, the upload service sends the request in one of two formats.

**JSON Upload**

If no files are included, the session is sent as a JSON payload through an HTTP POST request.

**Multipart Upload**

If files are included, the service creates a FormData request containing the session metadata and attached files. The metadata is included as a JSON string under the `metadata` field, while images are attached separately.

The service then sends the request to the configured endpoint.

## Server Upload Adapter

The adapter was introduced to avoid tying the upload service directly to a specific server implementation.

Rather than having `DataUpload.ts` handle both communication and data conversion, the adapter handles preparing the data before it is sent.

The default adapter currently returns the session using the following structure:

```
{
    sessionId: session.id,
    data: session
}
```

This includes the session ID and its associated data, including incidents.

The adapter also returns an array of files to upload. The default implementation does not automatically attach images.

As development continues, this adapter can be changed to match whatever format the server team decides to use without requiring changes to the underlying upload functionality.

## Image Uploads

The upload service was also extended to support transferring images alongside session information.

Images are associated with incidents, with the selected best image being identified through `best_image_id`.

The intended behavior is to upload only the selected best image for each incident rather than every image recorded during the ride.

When images are included in an upload, the adapter must provide the file URI, file name, MIME type, and field name.

```
type UploadFile = {
    fieldName: string;
    uri: string;
    name: string;
    type: string;
};
```

These files are then attached to the FormData request alongside the session metadata.

Image conversion to JPEG was introduced to create a consistent upload format.

It is important to note that the upload service only sends files provided by the adapter. Any logic for finding and preparing the selected best images must be handled before the request is sent at the moment.

## Local Test Server

A local Node.js server was created to test the upload functionality without requiring the server team's implementation to be available.

The server runs on port `3000` and accepts POST requests at `/upload`.

The test server also includes a simple dashboard that displays received sessions, allowing us to verify that information is being transferred correctly.

The main endpoints are:

| Endpoint       | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `GET /`        | Displays the test server dashboard              |
| `GET /health`  | Verifies that the server is running             |
| `GET /uploads` | Returns received upload information             |
| `POST /upload` | Receives uploaded session information and files |

The server uses Busboy to process multipart requests and save received images to an uploads directory.

### Starting the Server

Navigate to the directory containing the test server and run:

```
node TestServer.js
```

Once running, the dashboard can be accessed at:

```
http://localhost:3000
```

If testing on a physical device, the local IP address of the computer running the server will need to be used instead.

## Testing Uploads Through the Application

A test upload button was added to the Settings page to allow for testing directly through the application.

Currently, this button retrieves the available ride sessions from the local database and attempts to upload the first session.

To test the functionality:

1. Start the local test server.
2. Launch the IBDC application.
3. Navigate to Settings.
4. Generate mock ride session data if none is available.
5. Select **Test Server Upload**.
6. Check the test server dashboard to verify that the session was received.

The application also logs the result of the upload, which includes the HTTP status and session ID.

A successful server response should resemble:

```
{
    "ok": true,
    "message": "Session received",
    "sessionId": "session-id"
}
```

This confirms that the request was received by the test server. Image attachments should be checked separately to ensure that the expected files were included.

## Current Limitations

The upload functionality is currently intended as a foundation for the eventual server integration.

The Settings test button only uploads the first available session, and the endpoint is currently configured for local testing.

The default adapter sends session metadata without automatically attaching images. While the upload service supports multipart requests, the adapter must be configured to provide the appropriate files.

The local test server is also intended only for development and does not provide the persistent storage, authentication, or data validation expected from the final server.

## Future Integration

As the server team continues development, the next step will be to establish an agreed-upon structure for the data being sent.

This will include the format of ride sessions, incidents, and images, as well as the expected server response.

The current implementation was designed with this in mind. We can make changes to the data format without having to rewrite the communication functionality as needed.

Additional work will also be needed for handling failed uploads, retrying requests, tracking which sessions have already been uploaded, and ensuring that data is properly stored on the receiving server.