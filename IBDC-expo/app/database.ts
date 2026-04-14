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
    await database.runAsync(`DELETE FROM sessions`);
}