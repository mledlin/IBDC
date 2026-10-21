import {
    createMockDataSet,
    type MockDataFactoryOptions,
    type MockDataSet,
    type MockImageRecord,
    type MockIncidentRecord,
    type MockSessionRecord,
} from "../domain/MockDataFactory";

export type MockDataPersistence = {
    saveSession(
        session: MockSessionRecord,
    ): Promise<void>;

    saveIncident(
        incident: MockIncidentRecord,
    ): Promise<void>;

    saveImage(
        image: MockImageRecord,
    ): Promise<void>;
};

/**
 * Persists one complete mock session graph.
 *
 * Parent records are written before their children:
 *
 * session
 *   -> incidents
 *       -> images
 */
export async function persistMockDataSet(
    data: MockDataSet,
    persistence: MockDataPersistence,
): Promise<void> {
    await persistence.saveSession(
        data.session,
    );

    for (
        const incident of data.incidents
        ) {
        await persistence.saveIncident(
            incident,
        );

        const incidentImages =
            data.images.filter(
                (image) =>
                    image.incidentId ===
                    incident.id,
            );

        for (
            const image of incidentImages
            ) {
            await persistence.saveImage(
                image,
            );
        }
    }
}

/**
 * Generates one mock session data set and persists it.
 *
 * The generated data is returned so callers and tests can
 * inspect what was created.
 */
export async function generateMockSessionData(
    persistence: MockDataPersistence,
    options: MockDataFactoryOptions = {},
): Promise<MockDataSet> {
    const data =
        createMockDataSet(options);

    await persistMockDataSet(
        data,
        persistence,
    );

    return data;
}