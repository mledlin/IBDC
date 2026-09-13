import * as SQLite from "expo-sqlite";
import { Session } from "../../domain/Session"


// The code below was written by Jair
let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase() {
    if (db) {
        return db;
    }

    db = SQLite.openDatabaseSync("ibdc_test.db");

    db.execSync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
    `);

    return db;
}

export async function initDatabase() {
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
// The code above was written by Jair



export function deleteDatabase() {
    SQLite.deleteDatabaseSync("ibdc_test.db");
}

// Written by Jair
export async function createSession(id: string, createdTime: string): Promise<any> {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO sessions (id, created_time, date) VALUES (?, ?, ?)`,
        id,
        createdTime,
    );
}

// Written by Jair
//Retrieves all sessions, ordered by newest
export function getAllSessions(): Session[] {
    const database = getDatabase();

    return database.getAllSync(
        `SELECT * FROM sessions ORDER BY created_time DESC`
    );
}

export function printAllSessions(): void {
    let sessions: Session[] = getAllSessions();
    for (let session of sessions) {
        console.log(`\n${JSON.stringify(session, null, 2)}`);
    }
}

