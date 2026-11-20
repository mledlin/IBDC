import {
    isIncidentComplete,
} from "@/domain/Incident";

import {
    makeIncident,
} from "../factories/RideSessionFactory";

describe("Incident status", () => {
    test("Complete incident is reported as complete", () => {
        const incident = makeIncident();

        const result =
            isIncidentComplete(incident);

        expect(result).toBe(true);
    });

    test("Incident with a blank license plate is reported as incomplete", () => {
        const emptyLicensePlate =
            makeIncident({
                license_plate: "",
            });

        const whitespaceLicensePlate =
            makeIncident({
                license_plate: "   ",
            });

        expect(
            isIncidentComplete(
                emptyLicensePlate,
            ),
        ).toBe(false);

        expect(
            isIncidentComplete(
                whitespaceLicensePlate,
            ),
        ).toBe(false);
    });

    test("Incident with a blank vehicle color is reported as incomplete", () => {
        expect(
            isIncidentComplete(makeIncident({vehicle_color: ""})),
        ).toBe(false);

        expect(
            isIncidentComplete(makeIncident({vehicle_color: "   "})),
        ).toBe(false);
    });

    test("Incident without injury or severity selections is reported as incomplete", () => {
        expect(
            isIncidentComplete(makeIncident({injury: null})),
        ).toBe(false);

        expect(
            isIncidentComplete(makeIncident({severity_of_pass: null})),
        ).toBe(false);
    });

    test("Incident without optional fields is reported as complete", () => {
        const incident = makeIncident({
            driver_present: 0,
            driver_information: null,
            extra_comment: null,
            vehicle_make: null,
            vehicle_model: null,
            vehicle_year: null,
        });

        const result =
            isIncidentComplete(incident);

        expect(result).toBe(true);
    });

    test("Image, location, and timestamp are not required for completion", () => {
        const incident = makeIncident({
            best_image_id: null,
            imageFiles: [],
            latitude: null,
            longitude: null,
            created_time: null,
        });

        expect(isIncidentComplete(incident)).toBe(true);
    });

    test("Rejects invalid stored injury and severity-of-pass selections", () => {
        expect(
            isIncidentComplete(
                makeIncident({injury: "Maybe" as "Yes" | "No"}),
            ),
        ).toBe(false);
        expect(
            isIncidentComplete(
                makeIncident({
                    severity_of_pass: "Severe" as "Intent" | "Unaware",
                }),
            ),
        ).toBe(false);
    });
});