// database/IncidentDao.ts

import { getDatabase } from "./database";

//Retrieves incidents, with newest first
export async function getAllIncidents() {
    const database = await getDatabase();

    return await database.getAllAsync(`
        SELECT * FROM incidents
        ORDER BY created_time DESC
    `);
}

//Creates new incident and connects it to a session.
export async function createIncident(
    id: string,
    sessionId: string,
    latitude: number | null,
    longitude: number | null,
    licensePlate: string | null,
    bestImageId: string | null,
    injurySeverity: string | null,
    driverPresent: number,
    driverInformation: string | null,
    extraComment: string | null,
    vehicleMake: string | null,
    vehicleModel: string | null,
    vehicleColor: string | null,
    vehicleYear: string | null,
    createdTime: string
) {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO incidents (
            id,
            session_id,
            latitude,
            longitude,
            license_plate,
            best_image_id,
            injury_severity,
            driver_present,
            driver_information,
            extra_comment,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            vehicle_year,
            created_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        sessionId,
        latitude,
        longitude,
        licensePlate,
        bestImageId,
        injurySeverity,
        driverPresent,
        driverInformation,
        extraComment,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleYear,
        createdTime
    );
}
//Updates image marked as best for an incident
export async function updateIncidentBestImage(
    incidentId: string,
    imageId: string
) {
    const database = await getDatabase();

    await database.runAsync(
        `UPDATE incidents
         SET best_image_id = ?
         WHERE id = ?`,
        imageId,
        incidentId
    );
}
//Retrieves a singular incident by its ID
export async function getIncidentById(incidentId: string) {
    const database = await getDatabase();

    return await database.getFirstAsync(
        `SELECT * FROM incidents WHERE id = ?`,
        incidentId
    );
}
// Updates the incidentfields that are provided in the update object.
export async function updateIncidentDetails(
    incidentId: string,
    updates: {
        license_plate?: string | null;
        injury_severity?: string | null;
        driver_present?: number;
        driver_information?: string | null;
        extra_comment?: string | null;
        vehicle_make?: string | null;
        vehicle_model?: string | null;
        vehicle_color?: string | null;
        vehicle_year?: string | null;
    }
) {
    const database = await getDatabase();

    const entries = Object.entries(updates).filter(
        ([, value]) => value !== undefined
    );

    if (entries.length === 0) {
        return;
    }

    const setClause = entries
        .map(([key]) => `${key} = ?`)
        .join(", ");

    const values = entries.map(([, value]) => value);

    await database.runAsync(
        `UPDATE incidents SET ${setClause} WHERE id = ?`,
        ...values,
        incidentId
    );
}
//Deletes an incident and its related images from the database. 
export async function deleteIncident(incidentId: string) {
    const database = await getDatabase();

    try {
        await database.runAsync(
            `DELETE FROM incident_images WHERE incident_id = ?`,
            incidentId
        );

        await database.runAsync(
            `DELETE FROM incidents WHERE id = ?`,
            incidentId
        );
    } catch (error) {
        console.error("failed to delete incident", error);
        throw error;
    }
}