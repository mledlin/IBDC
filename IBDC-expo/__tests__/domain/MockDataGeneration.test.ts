import {
    MOCK_IMAGE_NAMES,
    MOCK_IMAGES_PER_INCIDENT,
    MOCK_INCIDENT_MAX,
    MOCK_INCIDENT_MAX_OFFSET_MS,
} from "@/domain/MockDataFactory";

import {
    generateMockSessionData,
} from "@/services/MockDataService";

import {
    filterRideSessions,
    paginateRideSessions,
} from "@/domain/RideSessionView";

import {
    makeConstantRandom,
    makeInMemoryMockDataPersistence,
} from "../factories/MockDataTestFactory";

const FIXED_NOW =
    new Date(
        "2026-09-16T12:00:00.000Z",
    ).getTime();

describe("Mock data generation", () => {
    test("Creates 1 valid session", async () => {
        const {
            persistence,
            store,
        } =
            makeInMemoryMockDataPersistence();

        const result =
            await generateMockSessionData(
                persistence,
                {
                    now: FIXED_NOW,
                    random:
                        makeConstantRandom(0.5),
                    incidentCount: 2,
                },
            );

        expect(
            store.sessions,
        ).toHaveLength(1);

        expect(
            store.sessions[0],
        ).toEqual(
            result.session,
        );

        expect(
            result.session.id,
        ).toMatch(
            /^mock-session-\d+-\d+$/,
        );

        expect(
            Number.isNaN(
                Date.parse(
                    result.session.createdTime,
                ),
            ),
        ).toBe(false);
    });

    test("Generated incidents stay within the 0 to 4 range", async () => {
        // Arrange
        const randomCases = [
            {
                randomValue: 0,
                expectedCount: 0,
            },
            {
                randomValue: 0.2,
                expectedCount: 1,
            },
            {
                randomValue: 0.4,
                expectedCount: 2,
            },
            {
                randomValue: 0.6,
                expectedCount: 3,
            },
            {
                randomValue: 0.999,
                expectedCount: 4,
            },
        ];

        for (
            const testCase of randomCases
            ) {
            const {
                persistence,
                store,
            } =
                makeInMemoryMockDataPersistence();

            const result =
                await generateMockSessionData(
                    persistence,
                    {
                        now: FIXED_NOW,
                        random:
                            makeConstantRandom(
                                testCase.randomValue,
                            ),
                    },
                );

            expect(
                result.incidents.length,
            ).toBeGreaterThanOrEqual(0);

            expect(
                result.incidents.length,
            ).toBeLessThanOrEqual(
                MOCK_INCIDENT_MAX,
            );

            expect(
                result.incidents,
            ).toHaveLength(
                testCase.expectedCount,
            );

            expect(
                store.incidents,
            ).toHaveLength(
                testCase.expectedCount,
            );
        }
    });

    test("Timestamps occur within 1 hour of the session start", async () => {
        const {
            persistence,
        } =
            makeInMemoryMockDataPersistence();

        // Act
        const result =
            await generateMockSessionData(
                persistence,
                {
                    now: FIXED_NOW,
                    random:
                        makeConstantRandom(0.5),
                    incidentCount: 4,
                },
            );

        const sessionStart =
            Date.parse(
                result.session.createdTime,
            );

        for (
            const incident of
            result.incidents
            ) {
            const incidentTime =
                Date.parse(
                    incident.createdTime,
                );

            expect(
                incidentTime,
            ).toBeGreaterThanOrEqual(
                sessionStart,
            );

            expect(
                incidentTime,
            ).toBeLessThanOrEqual(
                sessionStart +
                MOCK_INCIDENT_MAX_OFFSET_MS,
            );
        }
    });

    test("Mock images are created/attached to correct incidents", async () => {
        const {
            persistence,
            store,
        } =
            makeInMemoryMockDataPersistence();

        const result =
            await generateMockSessionData(
                persistence,
                {
                    now: FIXED_NOW,
                    random:
                        makeConstantRandom(0.5),
                    incidentCount: 3,
                },
            );

        expect(
            store.images,
        ).toHaveLength(
            3 *
            MOCK_IMAGES_PER_INCIDENT,
        );

        for (
            const incident of
            result.incidents
            ) {
            const incidentImages =
                store.images.filter(
                    (image) =>
                        image.incidentId ===
                        incident.id,
                );

            expect(
                incidentImages,
            ).toHaveLength(
                MOCK_IMAGES_PER_INCIDENT,
            );

            expect(
                incidentImages.map(
                    (image) =>
                        image.id,
                ),
            ).toEqual(
                MOCK_IMAGE_NAMES.map(
                    (imageKey) =>
                        `${incident.id}-${imageKey}`,
                ),
            );

            for (
                const image of
                incidentImages
                ) {
                expect(
                    image.incidentId,
                ).toBe(
                    incident.id,
                );
            }

            if (
                incident.bestImageId !==
                null
            ) {
                expect(
                    incidentImages.some(
                        (image) =>
                            image.id ===
                            incident.bestImageId,
                    ),
                ).toBe(true);
            }
        }
    });

    test("A mock session with 0 incidents is a valid Ride Session entry", async () => {
        const {
            persistence,
            store,
        } =
            makeInMemoryMockDataPersistence();

        const result =
            await generateMockSessionData(
                persistence,
                {
                    now: FIXED_NOW,
                    random:
                        makeConstantRandom(0.5),
                    incidentCount: 0,
                },
            );

        const rideSessions = [
            {
                id: result.session.id,
                incidents: [],
            },
        ];

        const filteredSessions =
            filterRideSessions(
                rideSessions,
                false,
                false,
            );

        const firstPage =
            paginateRideSessions(
                filteredSessions,
                0,
            );

        expect(
            store.sessions,
        ).toHaveLength(1);

        expect(
            store.incidents,
        ).toHaveLength(0);

        expect(
            store.images,
        ).toHaveLength(0);

        expect(
            filteredSessions,
        ).toHaveLength(1);

        expect(
            firstPage.visibleSessions,
        ).toHaveLength(1);

        expect(
            firstPage.visibleSessions[0].id,
        ).toBe(
            result.session.id,
        );
    });

    test("Repeated mocks create no ID duplicates or broken interactions", async () => {
        const {
            persistence,
            store,
        } =
            makeInMemoryMockDataPersistence();

        const generationCount = 100;
        const incidentsPerSession = 4;

        for (
            let i = 0;
            i < generationCount;
            i++
        ) {
            await generateMockSessionData(
                persistence,
                {
                    // Use same timestamp and random value on every generation.
                    now: FIXED_NOW,
                    random:
                        makeConstantRandom(0.5),
                    incidentCount:
                    incidentsPerSession,
                },
            );
        }

        expect(
            store.sessions,
        ).toHaveLength(
            generationCount,
        );

        expect(
            store.incidents,
        ).toHaveLength(
            generationCount *
            incidentsPerSession,
        );

        expect(
            store.images,
        ).toHaveLength(
            generationCount *
            incidentsPerSession *
            MOCK_IMAGES_PER_INCIDENT,
        );

        const sessionIds =
            store.sessions.map(
                (session) =>
                    session.id,
            );

        const incidentIds =
            store.incidents.map(
                (incident) =>
                    incident.id,
            );

        const imageIds =
            store.images.map(
                (image) =>
                    image.id,
            );

        expect(
            new Set(sessionIds).size,
        ).toBe(
            sessionIds.length,
        );

        expect(
            new Set(incidentIds).size,
        ).toBe(
            incidentIds.length,
        );

        expect(
            new Set(imageIds).size,
        ).toBe(
            imageIds.length,
        );

        const sessionIdSet =
            new Set(sessionIds);

        const incidentIdSet =
            new Set(incidentIds);

        for (
            const incident of
            store.incidents
            ) {
            expect(
                sessionIdSet.has(
                    incident.sessionId,
                ),
            ).toBe(true);
        }

        for (
            const image of
            store.images
            ) {
            expect(
                incidentIdSet.has(
                    image.incidentId,
                ),
            ).toBe(true);
        }
    });
});