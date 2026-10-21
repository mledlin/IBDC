/**
 * Factory for building mock session data.
 *
 * The Settings screen uses these factories through MockDataService so the
 * generation rules can be tested without rendering React Native UI or
 * requiring a SQLite database.
 */

// 2 years
export const MOCK_SESSION_MAX_AGE_MS =
    2 * 365 * 24 * 60 * 60 * 1000;

export const MOCK_INCIDENT_MAX = 4;

// 1 hour
export const MOCK_INCIDENT_MAX_OFFSET_MS =
    60 * 60 * 1000;

export const MOCK_IMAGES_PER_INCIDENT = 4;

export const MOCK_IMAGE_NAMES = [
    "example1",
    "example2",
    "example3",
    "example4",
] as const;

const MOCK_PLATES = [
    "ABC1234",
    "XYZ32",
    "DSA123",
    "1231AS",
    "ASU3232",
];

const MOCK_SEVERITIES = [
    "minor",
    "moderate",
    "major",
];

const MOCK_DRIVER_INFO = [
    "Unknown",
    "No driver interaction",
    "Chris 123-456-7890",
    "Matthew 987-654-3210",
    "Jair 14 jefferson Lane",
    "Collin 1600 Pennsylvania Ave",
];

const MOCK_COMMENTS = [
    "Vehicle was way too close",
    "Driver swerved near cyclist",
    "Threatened me with a taser!",
    "Tried to run me off the road",
    "Had to be saved by Superman",
    "I got distracted and veered towards cars",
];

const MOCK_VEHICLES = [
    {
        make: "Toyota",
        model: "Focus",
        color: "Blue",
        year: "2020",
    },
    {
        make: "Honda",
        model: "Civic",
        color: "Black",
        year: "2018",
    },
    {
        make: "Ford",
        model: "F-150",
        color: "White",
        year: "2022",
    },
    {
        make: "Chevrolet",
        model: "Malibu",
        color: "Silver",
        year: "2019",
    },
    {
        make: "Nissan",
        model: "Altima",
        color: "Red",
        year: "2021",
    },
];

const MOCK_COORDINATES = [
    {
        lat: 33.3333,
        long: -111.1111,
    },
    {
        lat: 222.2222,
        long: 212.1212,
    },
    {
        lat: 44.4444,
        long: -111.1111,
    },
    {
        lat: 303.4484,
        long: -212.0740,
    },
    {
        lat: 30.3030,
        long: -20.1234,
    },
    {
        lat: 21.1234,
        long: -119.1191,
    },
];

export type MockSessionRecord = {
    id: string;
    createdTime: string;
};

export type MockIncidentRecord = {
    id: string;
    sessionId: string;
    latitude: number | null;
    longitude: number | null;
    licensePlate: string | null;
    bestImageId: string | null;
    injurySeverity: string | null;
    driverPresent: number;
    driverInformation: string | null;
    extraComment: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleColor: string | null;
    vehicleYear: string | null;
    createdTime: string;
};

export type MockImageRecord = {
    id: string;
    incidentId: string;
    filePath: string;
    thumbnailPath: string | null;
    source: string;
};

export type MockDataSet = {
    session: MockSessionRecord;
    incidents: MockIncidentRecord[];
    images: MockImageRecord[];
};

export type MockDataFactoryOptions = {
    now?: number;
    random?: () => number;
    incidentCount?: number;
};

let mockSessionSequence = 0;

/**
 * Returns a random integer between min and max, inclusive.
 */
function randomInt(
    min: number,
    max: number,
    random: () => number,
): number {
    return Math.floor(
        random() * (max - min + 1)
    ) + min;
}

/**
 * Returns one random item from the supplied array.
 */
function pickRandom<T>(
    items: readonly T[],
    random: () => number,
): T {
    return items[
        Math.floor(random() * items.length)
        ];
}

/**
 * Creates a session ID that remains unique even if more than
 * one mock session is generated at the same timestamp.
 */
function nextMockSessionId(now: number): string {
    mockSessionSequence += 1;

    return `mock-session-${now}-${mockSessionSequence}`;
}

/**
 * Builds one complete mock session data set without writing
 * anything to the database.
 */
export function createMockDataSet(
    options: MockDataFactoryOptions = {},
): MockDataSet {
    const now =
        options.now ?? Date.now();

    const random =
        options.random ?? Math.random;

    const sessionStartTime = new Date(
        now -
        randomInt(
            0,
            MOCK_SESSION_MAX_AGE_MS,
            random,
        ),
    );

    const sessionId =
        nextMockSessionId(now);

    const incidentCount =
        options.incidentCount ??
        Math.floor(
            random() *
            (MOCK_INCIDENT_MAX + 1)
        );

    if (
        incidentCount < 0 ||
        incidentCount > MOCK_INCIDENT_MAX
    ) {
        throw new RangeError(
            `incidentCount must be between 0 and ${MOCK_INCIDENT_MAX}`,
        );
    }

    const incidents: MockIncidentRecord[] = [];
    const images: MockImageRecord[] = [];

    for (
        let i = 0;
        i < incidentCount;
        i++
    ) {
        const hasSelectedImage =
            random() < 0.7;

        const vehicle =
            pickRandom(
                MOCK_VEHICLES,
                random,
            );

        const coordinate =
            pickRandom(
                MOCK_COORDINATES,
                random,
            );

        const incidentId =
            `${sessionId}-incident-${i + 1}`;

        const selectedImageKey =
            hasSelectedImage
                ? pickRandom(
                    MOCK_IMAGE_NAMES,
                    random,
                )
                : null;

        const bestImageId =
            selectedImageKey
                ? `${incidentId}-${selectedImageKey}`
                : null;

        const incidentTime =
            new Date(
                sessionStartTime.getTime() +
                randomInt(
                    0,
                    MOCK_INCIDENT_MAX_OFFSET_MS,
                    random,
                ),
            );

        incidents.push({
            id: incidentId,
            sessionId,
            latitude: coordinate.lat,
            longitude: coordinate.long,
            licensePlate:
                pickRandom(
                    MOCK_PLATES,
                    random,
                ),
            bestImageId,
            injurySeverity:
                pickRandom(
                    MOCK_SEVERITIES,
                    random,
                ),
            driverPresent:
                random() < 0.5
                    ? 0
                    : 1,
            driverInformation:
                pickRandom(
                    MOCK_DRIVER_INFO,
                    random,
                ),
            extraComment:
                pickRandom(
                    MOCK_COMMENTS,
                    random,
                ),
            vehicleMake:
            vehicle.make,
            vehicleModel:
            vehicle.model,
            vehicleColor:
            vehicle.color,
            vehicleYear:
            vehicle.year,
            createdTime:
                incidentTime.toISOString(),
        });

        for (
            const imageKey of MOCK_IMAGE_NAMES
            ) {
            images.push({
                id:
                    `${incidentId}-${imageKey}`,
                incidentId,
                filePath: imageKey,
                thumbnailPath: null,
                source: "mock",
            });
        }
    }

    return {
        session: {
            id: sessionId,
            createdTime:
                sessionStartTime.toISOString(),
        },
        incidents,
        images,
    };
}