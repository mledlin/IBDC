// database/ImageDao.ts

import { getDatabase } from "./database";
// Creates a new image record connected to an incident.
// This stores the image file path and optional thumbnail path,
// but does not store the actual image binary in the database, however depending on protobuf impl. this may change.
export async function createIncidentImage(
    id: string,
    incidentId: string,
    filePath: string,
    thumbnailPath: string | null,
    source: string
) {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO incident_images (
            id,
            incident_id,
            file_path,
            thumbnail_path,
            source
        ) VALUES (?, ?, ?, ?, ?)`,
        id,
        incidentId,
        filePath,
        thumbnailPath,
        source
    );
}
//Retrieves all incident images from the database.
export async function getAllIncidentImages() {
    const database = await getDatabase();

    return await database.getAllAsync(`
        SELECT * FROM incident_images
    `);
}
//Retrieves all image records of a specifc incident. 
export async function getIncidentImagesByIncidentId(incidentId: string) {
    const database = await getDatabase();

    return await database.getAllAsync(
        `SELECT * FROM incident_images WHERE incident_id = ?`,
        incidentId
    );
}
//Deletes all images connected to a specific incident.
export async function deleteImagesByIncidentId(incidentId: string) {
    const database = await getDatabase();

    await database.runAsync(
        `DELETE FROM incident_images WHERE incident_id = ?`,
        incidentId
    );
}

// Helper for mock images.
// Actual device images should eventually use local file path URIs instead.
export function getMockImageSource(filePath: string) {
    switch (filePath) {
        case "example1":
            return require("@/assets/images/example.jpg");
        case "example2":
            return require("@/assets/images/example2.jpg");
        case "example3":
            return require("@/assets/images/example3.jpg");
        case "example4":
            return require("@/assets/images/example4.jpg");
        default:
            return null;
    }
}