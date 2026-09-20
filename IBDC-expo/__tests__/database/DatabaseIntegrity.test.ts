import type {
    SQLiteDatabase,
} from "expo-sqlite";

import {
    initializeDatabase,
} from "@/database/database";

import {
    createSession,
    getAllSessions,
} from "@/database/SessionDao";

import {
    createIncident,
    getAllIncidents,
} from "@/database/IncidentDao";

import {
    createIncidentImage,
    getAllIncidentImages,
} from "@/database/ImageDao";

import {
    createFreshTestDatabase,
    destroyTestDatabase,
    INIT_TEST_DATABASE,
    INTEGRITY_TEST_DATABASE,
} from "../factories/DatabaseTestFactory";


/**
 * THIS DOESN'T WORK YET.
 * I believe running sqlite on mocked native code is failing, and I will need to do a different approach.

 */




describe(
    "Database initialization",
    () => {
        let database:
            SQLiteDatabase | null = null;

        beforeEach(async () => {
            database =
                await createFreshTestDatabase(
                    INIT_TEST_DATABASE
                );
        });

        afterEach(async () => {
            await destroyTestDatabase(
                database,
                INIT_TEST_DATABASE
            );

            database = null;
        });

        test(
            "Fresh database init creates all required tables",
            async () => {
                if (!database) {
                    throw new Error(
                        "Test db not initialized"
                    );
                }

                const objects =
                    await database
                        .getAllAsync<{
                            name: string;
                            type: string;
                        }>(`
                            SELECT name, type
                            FROM sqlite_master
                            WHERE type IN (
                                'table',
                                'index'
                            )
                        `);

                const names =
                    objects.map(
                        (object) =>
                            object.name
                    );

                expect(names).toContain(
                    "sessions"
                );

                expect(names).toContain(
                    "incidents"
                );
            }
        );

        test(
            "Repeated database initialization preserves existing data",
            async () => {
                if (!database) {
                    throw new Error(
                        "Test database was not initialized"
                    );
                }

                await createSession(
                    "db-test-session-1",
                    "2026-09-16T12:00:00.000Z",
                    database
                );

                await initializeDatabase(
                    database
                );

                const sessions =
                    await getAllSessions(
                        database
                    );

                // qty
                expect(
                    sessions
                ).toHaveLength(1);

                // id

            }
        );
    }
);

// database integrity
