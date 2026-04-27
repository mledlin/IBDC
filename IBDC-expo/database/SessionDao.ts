// database/SessionDao.ts

import { getDatabase } from "./database";
import { getAllIncidents } from "./IncidentDao";
import { getAllIncidentImages, getMockImageSource} from "./ImageDao";

//Creates a new session record
export async function createSession(id: string, createdTime: string) {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO sessions (id, created_time) VALUES (?, ?)`,
        id,
        createdTime
    );
}
//Retrieves all sessions, ordered by newest 
export async function getAllSessions() {
    const database = await getDatabase();

    return await database.getAllAsync(
        `SELECT * FROM sessions ORDER BY created_time DESC`
    );
}
//Removes all session data including related incidents and incident images.
//Currently unused but can eventually be adapted into a wipe all data feature?
export async function deleteAllSessions() {
    const database = await getDatabase();

    try {
        await database.runAsync(`DELETE FROM incident_images`);
        await database.runAsync(`DELETE FROM incidents`);
        await database.runAsync(`DELETE FROM sessions`);
    } catch (error) {
        console.error("Failed to delete session data", error);
        throw error;
    }
}
//Core logic for Creating session history used in UI
// Loads all session, incidents, and images
// It then matches each incident to a parent session through its session id.
// Does the same with images to parent incident using incident id.
// Returns a list of session where each session containts its incidents, and each incident contains its images.
export async function getSessionHistoryData() {
    const sessions = await getAllSessions();
    const incidents = await getAllIncidents();
    const images = await getAllIncidentImages();

    return sessions.map((session: any) => {
        const sessionIncidents = incidents
            .filter((incident: any) => incident.session_id === session.id)
            .map((incident: any) => {
                const incidentImages = images
                    .filter((image: any) => image.incident_id === incident.id)
                    .map((image: any) => ({
                        id: image.id,
                        file_path: image.file_path,

                        // This is mock and should be replaced with the following in future
                        // implementation, where file_path is local file directory.
                        uri: getMockImageSource(image.file_path),
                        // uri: { uri: image.file_path }
                    }));

                return {
                    ...incident,
                    imageFiles: incidentImages,
                    selectedImageId: incident.best_image_id,
                };
            });

        return {
            ...session,
            startDateStamp: session.created_time
                ? new Date(session.created_time)
                : null,
            incidents: sessionIncidents,
        };
    });
}

//Deletes a session that has no incidents.
export async function deleteSession(sessionId: string) {
    const database = await getDatabase();

    try {
        await database.runAsync(
            `DELETE FROM sessions
             WHERE id = ?
             AND NOT EXISTS (
                 SELECT 1
                 FROM incidents
                 WHERE incidents.session_id = sessions.id
             )`,
            sessionId
        );
    } catch (error) {
        console.error("Error deleting session", error);
        throw error;
    }
}

//Deletes all sessions older than cutoff date.
export async function deleteSessionsOlderThan(cutoffIso: string) {
    const database = await getDatabase();

    try {
        await database.runAsync(
            `DELETE FROM incident_images
             WHERE incident_id IN (
                 SELECT id
                 FROM incidents
                 WHERE session_id IN (
                     SELECT id
                     FROM sessions
                     WHERE created_time < ?
                 )
             )`,
            cutoffIso
        );

        await database.runAsync(
            `DELETE FROM incidents
             WHERE session_id IN (
                 SELECT id
                 FROM sessions
                 WHERE created_time < ?
             )`,
            cutoffIso
        );

        await database.runAsync(
            `DELETE FROM sessions
             WHERE created_time < ?`,
            cutoffIso
        );
    } catch (error) {
        console.error("Error deleting old session data", error);
        throw error;
    }
}