import * as SQLite from "expo-sqlite";

import {
    initializeDatabase,
    openDatabase,
} from "@/database/database";

export const INIT_TEST_DATABASE =
    "ibdc-test-init.db";

export const INTEGRITY_TEST_DATABASE =
    "ibdc-test-integrity.db";

/**
 * Deletes a temp test database if it exists.
 */
export async function deleteTestDatabase(
    databaseName: string
): Promise<void> {
    try {
        await SQLite.deleteDatabaseAsync(
            databaseName
        );
    } catch {

    }
}

/**
 * Opens a new temp database and initializes it with the real app schema.
 */
export async function createFreshTestDatabase(
    databaseName: string
): Promise<SQLite.SQLiteDatabase> {
    await deleteTestDatabase(
        databaseName
    );

    const database =
        await openDatabase(
            databaseName
        );

    await initializeDatabase(
        database
    );

    return database;
}

/**
 * Closes and deletes a temp database.
 */
export async function destroyTestDatabase(
    database:
        SQLite.SQLiteDatabase | null,
    databaseName: string
): Promise<void> {
    if (database) {
        await database.closeAsync();
    }

    await deleteTestDatabase(
        databaseName
    );
}

/**
 * Standard incident values used by database tests.
 */
export function makeDatabaseTestIncident(
    overrides: {
        id?: string;
        sessionId?: string;
    } = {},
) {
    return {
        id:
            overrides.id ??
            "db-test-incident-1",

        sessionId:
            overrides.sessionId ??
            "db-test-session-1",

        latitude: 32.0,
        longitude: -84.0,
        licensePlate: "TEST123",
        bestImageId: null,
        injurySeverity: null,
        driverPresent: 0,
        driverInformation: null,
        extraComment: null,
        vehicleMake: null,
        vehicleModel: null,
        vehicleColor: null,
        vehicleYear: null,

        createdTime:
            "2026-09-16T12:00:00.000Z",
    };
}

/**
 * Placing this class in the test folder keeps related classes together, but running jest will run all tests in the
 * folder, and this is one of them. Having no tests shows as a fail. This test just avoids that. I'm completely open
 * to better ways of doing this.
 */
describe("Prevent this from showing as a fail", () => {
    test("Placeholder Test", () => {
        expect("Hi").toEqual("Hi");
    })
});