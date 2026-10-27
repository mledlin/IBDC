import type {
    MockImageRecord,
    MockIncidentRecord,
    MockSessionRecord,
} from "../../domain/MockDataFactory";

import type {
    MockDataPersistence,
} from "../../services/MockDataService";

/**
 * Records everything written through the mock-data persistence interface.
 *
 * This allows tests to inspect generated database records without requiring
 * Expo SQLite.
 */
export type InMemoryMockDataStore = {
    sessions: MockSessionRecord[];
    incidents: MockIncidentRecord[];
    images: MockImageRecord[];
};

/**
 * Creates an in-memory implementation of MockDataPersistence.
 *
 * It also rejects duplicate IDs, similar to what the real database primary
 * keys should do.
 */
export function makeInMemoryMockDataPersistence(): {
    persistence: MockDataPersistence;
    store: InMemoryMockDataStore;
} {
    const store: InMemoryMockDataStore = {
        sessions: [],
        incidents: [],
        images: [],
    };

    const persistence: MockDataPersistence = {
        async saveSession(session) {
            if (
                store.sessions.some(
                    (existing) =>
                        existing.id === session.id,
                )
            ) {
                throw new Error(
                    `Duplicate session ID: ${session.id}`,
                );
            }

            store.sessions.push({
                ...session,
            });
        },

        async saveIncident(incident) {
            if (
                store.incidents.some(
                    (existing) =>
                        existing.id === incident.id,
                )
            ) {
                throw new Error(
                    `Duplicate incident ID: ${incident.id}`,
                );
            }

            store.incidents.push({
                ...incident,
            });
        },

        async saveImage(image) {
            if (
                store.images.some(
                    (existing) =>
                        existing.id === image.id,
                )
            ) {
                throw new Error(
                    `Duplicate image ID: ${image.id}`,
                );
            }

            store.images.push({
                ...image,
            });
        },
    };

    return {
        persistence,
        store,
    };
}

/**
 * Creates a predictable replacement for Math.random().
 * The returned function always returns the supplied value.
 */
export function makeConstantRandom(
    value: number,
): () => number {
    if (value < 0 || value >= 1) {
        throw new RangeError(
            "Random value must be >= 0 and < 1",
        );
    }

    return () => value;
}
