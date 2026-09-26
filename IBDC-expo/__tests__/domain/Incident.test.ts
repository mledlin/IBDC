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

    test("Incident with no images is reported as incomplete", () => {
        const incident = makeIncident({
            imageFiles: [],
        });

        const result =
            isIncidentComplete(incident);

        expect(result).toBe(false);
    });

    test("Incident without selected best image is reported as incomplete", () => {
        const incident = makeIncident({
            best_image_id: null,
        });

        const result =
            isIncidentComplete(incident);

        expect(result).toBe(false);
    });

    test("Incident missing latitude or longitude is reported as incomplete", () => {
        const missingLatitude =
            makeIncident({
                latitude: null,
            });

        const missingLongitude =
            makeIncident({
                longitude: null,
            });

        expect(
            isIncidentComplete(
                missingLatitude,
            ),
        ).toBe(false);

        expect(
            isIncidentComplete(
                missingLongitude,
            ),
        ).toBe(false);
    });

    test("Incident missing creation time is reported as incomplete", () => {
        const nullCreationTime =
            makeIncident({
                created_time: null,
            });

        const emptyCreationTime =
            makeIncident({
                created_time: "",
            });

        expect(
            isIncidentComplete(
                nullCreationTime,
            ),
        ).toBe(false);

        expect(
            isIncidentComplete(
                emptyCreationTime,
            ),
        ).toBe(false);
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

    test("Incident without optional fields is reported as complete", () => {
        const incident = makeIncident({
            injury_severity: null,
            driver_present: 0,
            driver_information: null,
            extra_comment: null,
            vehicle_make: null,
            vehicle_model: null,
            vehicle_color: null,
            vehicle_year: null,
        });

        const result =
            isIncidentComplete(incident);

        expect(result).toBe(true);
    });
});