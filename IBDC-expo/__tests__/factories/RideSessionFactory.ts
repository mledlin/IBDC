/**
 * Dont run this as it will fail! This is just a helper class for ride sessions.
 */

import type {Incident} from "@/domain/Incident";
import type {RideSessionLike} from "@/domain/RideSessionView";

export type TestRideSession = RideSessionLike & {
    id: string;
};

/**
 * Creates a baseline incident. This can be tested and can be overridden for specific incidents.
 */
export function makeIncident(
    overrides: Partial<Incident> = {},
): Incident {
    const id = overrides.id ?? "incident-1";

    return {
        // default values
        id,
        session_id: "session-1",
        latitude: 32.0,
        longitude: -84.0,
        created_time: "2026-09-09T12:00:00.000Z",
        license_plate: "ABC123",
        best_image_id: `${id}-image-1`,
        injury_severity: null,
        driver_present: 0,
        driver_information: null,
        extra_comment: "Test comment",
        vehicle_make: null,
        vehicle_model: null,
        vehicle_color: null,
        vehicle_year: null,
        imageFiles: [
            {
                id: `${id}-image-1`,
                fileName: "test.jpg",
                uri: {uri: "test://image.jpg"},
            },
        ],
        selectedImageId: `${id}-image-1`,

        // imported values
        ...overrides,
    };
}

/**
 * Test function
 */
export function makeIncompleteIncident(id: string): Incident {
    return makeIncident({
        id,
        latitude: null,
    });
}

/**
 * Test function
 */
export function makeSession(
    id: string,
    incidents: Incident[] = [],
): TestRideSession {
    return {
        id,
        incidents,
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