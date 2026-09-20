// database/database.ts
// Handles the shared SQLite database connection and initializes all database tables.
// This file should only contain database setup logic.
// Specific methods should be placed in their respective DAO files.

// Pro tip: DOnt auto-format this file... SQL becomes a mess.

import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initializes the application's primary database.
 */
export async function initDatabase(): Promise<void> {
    const database =
        await getDatabase();

    await initializeDatabase(database);
}

/**
 * Returns the app's hard-coded primary database.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (db) {
        return db;
    }

    db = await openDatabase("ibdc.db");

    return db;
}

/**
 * This will get a database by name. Added to enable testing databases that dont impact the real one.
 */
export async function openDatabase(
    databaseName: string
): Promise<SQLite.SQLiteDatabase> {
    const database =
        await SQLite.openDatabaseAsync(databaseName);

    await database.execAsync(`
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
    `);

    return database;
}

/**
 * Creates all application tables and indexes in the supplied database.
 *
 * This allows production and test databases to use exactly the same schema.
 */
export async function initializeDatabase(
    database: SQLite.SQLiteDatabase
): Promise<void> {
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