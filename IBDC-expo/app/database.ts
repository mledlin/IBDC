import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
    if (db)
        return db;
    db = await SQLite.openDatabaseAsync('ibdc.db')

    await db.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        
        `);
    return db;
}

export async function initDatabase(){
    const database = await getDatabase();

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY NOT NULL,
            created_time TEXT NOT NULL,
            last_gps_longitude REAL,
            last_gps_latitude REAL,
            last_gps_time TEXT
       );

       CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY NOT NULL,
            session_id TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            license_plate TEXT,
            best_image_id TEXT,
            injury_severity TEXT,
            driver_present INTEGER NOT NULL DEFAULT 0,
            driver_information TEXT,
            extra_comment TEXT,
            vehicle_make TEXT,
            vehicle_model TEXT,
            vehicle_color TEXT,
            vehicle_year TEXT,
            created_time TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS incident_images (
            id TEXT PRIMARY KEY NOT NULL,
            incident_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            thumbnail_path TEXT,
            source TEXT NOT NULL DEFAULT 'device',
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY NOT NULL,
            bluetooth_address TEXT UNIQUE NOT NULL,
            is_paired INTEGER NOT NULL DEFAULT 0,
            connection_status TEXT,
            battery_level INTEGER,
            storage TEXT,
            firmware_version TEXT
            );
        
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY NOT NULL,
            image_capture INTEGER NOT NULL DEFAULT 1,
            day_limit INTEGER
            );
        
        CREATE INDEX IF NOT EXISTS idx_incidents_session_id
        ON incidents(session_id);

        CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id
        ON incident_images(incident_id);

        CREATE INDEX IF NOT EXISTS idx_incidents_best_image_id
        ON incidents(best_image_id);
        
        `);
}

export async function createSession(id: string) {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO sessions (id, created_time) VALUES (?, ?)`,
        id,
        new Date().toISOString()
    );
}

export async function getAllSessions(){
    const database = await getDatabase();
    return await database.getAllAsync(`SELECT * FROM sessions ORDER by created_time DESC`);
}

export async function deleteAllSessions(){
    const database = await getDatabase();
    try{
        await database.runAsync(`DELETE FROM incident_images`);
        await database.runAsync(`DELETE FROM incidents`);
        await database.runAsync(`DELETE FROM sessions`);
    } catch (error) {
        console.error("Failed to delete session data", error);
        throw error;
    }
}

export async function getAllIncidents() {
    const database = await getDatabase();
    return await database.getAllAsync(`
        SELECT * FROM incidents
        ORDER BY created_time DESC
        `);
}

export async function getAllIncidentImages() {
    const database = await getDatabase();
    return await database.getAllAsync(`
        SELECT * FROM incident_images
        `)
}

export async function getSessionHistoryData(){
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
                    //This is mock and should be replaced with the following in future
                    //implementation, where file path is local file directory
                    uri: getMockImageSource(image.file_path), //uri: { uri: image.file_path }
                }));
                return {
                    ...incident,
                    imageFiles: incidentImages,
                    selectedImageId: incident.best_image_id,
                };
        });

        return {
            ...session,
            startDateStamp: session.created_time ? new Date(session.created_time) : null,
            incidents: sessionIncidents,
        };
    })
}

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
        ` INSERT INTO incidents (
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

//Helper for images. Purely for mock, actual images should be loaded from local file path uri
export function getMockImageSource(filePath: string) {
    switch(filePath){
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

export async function getIncidentById(incidentId: string){
    const database = await getDatabase();
    return await database.getFirstAsync(
        `SELECT * FROM incidents WHERE id = ?`,
        incidentId
    );
}

export async function getIncidentImagesByIncidentId(incidentId: string){
    const database = await getDatabase();
    return await database.getAllAsync(
        `SELECT * FROM incident_images WHERE incident_id = ?`,
        incidentId
    );
}

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
    const entries = Object.entries(updates).filter(([, value]) => value!== undefined);

    if(entries.length === 0)
        return;

    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);

    await database.runAsync(
        `UPDATE incidents SET ${setClause} WHERE id = ?`,
        ...values,
        incidentId
    );

}
//TODO
/*
Delete Incident From Session
Update Session Data and DB To Reflect The removed incident from view.
*/
export async function deleteIncident(
    incidentId: string,
){
    const database = await getDatabase();
    try{
        await database.runAsync(
            `DELETE FROM incident_images WHERE incident_id = ?`,
            incidentId
        );
        await database.runAsync(
            `DELETE FROM incidents WHERE id = ?`,
            incidentId
        )
    } catch (error) {
        console.error("failed to delete incident", error);
        throw error;
    }
}
