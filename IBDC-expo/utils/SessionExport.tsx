import {printAsync} from "expo-print";
import {File as ExpoFile} from "expo-file-system";
import {Asset} from "expo-asset";
import {getIncidentImagesByIncidentId, getMockImageSource} from "@/database/ImageDao";

/**
 * Exports a ride session and its incidents as a PDF.
 *
 * The PDF is generated from an HTML report and then opened
 * using the device's native print dialog.
 *
 * @param session The ride session being exported.
 */
export async function exportRideSessionToPdf(session: any) {
    const formattedDate = session.startDateStamp
        ? session.startDateStamp.toLocaleString()
        : "Unknown Date";

    const incidents = session.incidents ?? [];

    const incidentRows = (await Promise.all(
        incidents.map(async (incident: any, index: number) => {
            const imageDataUri = await getBestImageDataUri(incident);
            const imageHtml = imageDataUri
                ? `
                    <div class="incident-photo">
                        <strong>Selected Image:</strong>
                        <img src="${imageDataUri}" alt="Incident Image" />
                    </div>
                `
                : "";

            return `
                <div class="incident">
                    <h2>Incident ${index + 1}</h2>

                    <div class="row">
                        <strong>Time:</strong>
                        <span>${formatTimestamp(incident.created_time)}</span>
                    </div>

                    <div class="row">
                        <strong>Location:</strong>
                        <span>
                            ${incident.latitude ?? "N/A"},
                            ${incident.longitude ?? "N/A"}
                        </span>
                    </div>

                    <div class="row">
                        <strong>License Plate:</strong>
                        <span>${incident.license_plate || "Not provided"}</span>
                    </div>

                    <div class="row">
                        <strong>Injury Severity:</strong>
                        <span>${incident.injury_severity || "None"}</span>
                    </div>

                    <div class="row">
                        <strong>Vehicle:</strong>
                        <span>
                            ${formatVehicle(incident)}
                        </span>
                    </div>

                    <div class="row">
                        <strong>Driver Present:</strong>
                        <span>
                            ${incident.driver_present ? "Yes" : "No"}
                        </span>
                    </div>

                    <div class="row">
                        <strong>Driver Information:</strong>
                        <span>
                            ${incident.driver_information || "None"}
                        </span>
                    </div>

                    <div class="row">
                        <strong>Comments:</strong>
                        <span>
                            ${incident.extra_comment || "None"}
                        </span>
                    </div>

                    ${imageHtml}
                </div>
            `;
        })
    )).join("");

    const html = `
        <!DOCTYPE html>

        <html>
            <head>
                <meta charset="UTF-8" />

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 32px;
                        color: #1f2937;
                    }

                    h1 {
                        margin-bottom: 4px;
                    }

                    .session-meta {
                        color: #6b7280;
                        margin-bottom: 28px;
                    }

                    .incident {
                        border: 1px solid #d1d5db;
                        border-radius: 10px;
                        padding: 18px;
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                    }

                    .incident h2 {
                        margin-top: 0;
                        font-size: 18px;
                    }

                    .row {
                        margin: 8px 0;
                    }

                    .row strong {
                        display: inline-block;
                        width: 150px;
                    }

                    .incident-photo {
                        margin-top: 16px;
                        page-break-inside: avoid;
                    }

                    .incident-photo img {
                        display: block;
                        max-width: 100%;
                        max-height: 320px;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                        margin-top: 8px;
                    }
                </style>
            </head>

            <body>
                <h1>Ride Session Report</h1>

                <div class="session-meta">
                    <div>${formattedDate}</div>

                    <div>
                        ${incidents.length}
                        Incident${incidents.length === 1 ? "" : "s"}
                    </div>
                </div>

                ${incidentRows || "<p>No incidents recorded.</p>"}
            </body>
        </html>
    `;

    await printAsync({html});
}

/**
 * Formats an incident timestamp into a readable local date and time.
 *
 * @param value The timestamp being formatted.
 * @returns A formatted local date and time.
 */
function formatTimestamp(value: any): string {
    if (!value) {
        return "Unknown";
    }

    const numericValue = Number(value);

    const date = Number.isNaN(numericValue)
        ? new Date(value)
        : new Date(
            numericValue < 10_000_000_000
                ? numericValue * 1000
                : numericValue
        );

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

/**
 * Combines available vehicle information into a single display string.
 *
 * Empty vehicle fields are excluded from the final value.
 *
 * @param incident The incident containing vehicle information.
 * @returns The formatted vehicle description.
 */
function formatVehicle(incident: any): string {
    const vehicleDetails = [
        incident.vehicle_year,
        incident.vehicle_make,
        incident.vehicle_model,
        incident.vehicle_color,
    ].filter(Boolean);

    return vehicleDetails.length > 0
        ? vehicleDetails.join(" ")
        : "Not provided";
}

/**
 * Retrieves the selected incident image and converts it
 * into a Base64 data URI for embedding in the PDF.
 */
async function getBestImageDataUri(incident: any): Promise<string | null> {
    if (!incident?.id || !incident.best_image_id) {
        return null;
    }

    try {
        const images = await getIncidentImagesByIncidentId(incident.id);

        const selected = images.find(
            (image: any) =>
                String(image.id) === String(incident.best_image_id)
        );

        if (!selected?.file_path) {
            return null;
        }
        // Handling mock sources. This can be removed when mock images are no longer used.
        const mockSource = getMockImageSource(selected.file_path);
        let uri = selected.file_path;
        let mimeType = /\.png(?:[?#]|$)/i.test(uri)
            ? "image/png"
            : "image/jpeg";

        if (typeof mockSource === "number") {
            const asset = Asset.fromModule(mockSource);
            await asset.downloadAsync();

            uri = asset.localUri ?? asset.uri;
            mimeType = asset.type?.toLowerCase() === "png"
                ? "image/png"
                : "image/jpeg";
        } else if (
            mockSource &&
            typeof mockSource === "object" &&
            "uri" in mockSource &&
            typeof mockSource.uri === "string"
        ) {
            uri = mockSource.uri;
            mimeType = /\.png(?:[?#]|$)/i.test(uri)
                ? "image/png"
                : "image/jpeg";
        }

        if (!uri.startsWith("file://")) {
            console.warn("PDF export: Image is not a local file:", uri);
            return null;
        }

        const file = new ExpoFile(uri);
        const base64 = await file.base64();

        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.warn("PDF export: Could not load image", error);
        return null;
    }
}
