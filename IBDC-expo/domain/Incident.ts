// A data only class is often best represented as a type in TypeScript as no behavior is needed.
// As such I have created a type to hold all necessary data for an incident.

// Incident object that can hold all relevant information.

// The license plate and rider notes may be blank when an incident is first triggered.

// Selected image should be an id of an image from the array of options.
//      - This will be selected on a special screen

// GPS Location data from the phone will include location and a timestamp.
//      - The timestamp may need to be converted to local time.

// A session that this incident is associated with may be included but could also remain
// separate and be assigned to sessions based on timestamps. Further work on a session
// type/object is needed first.

import type {ImageSourcePropType} from "react-native";

export type InjurySelection = "Yes" | "No";
export type SeverityOfPass = "Intent" | "Unaware";

export function isInjurySelection(value: unknown): value is InjurySelection {
    return value === "Yes" || value === "No";
}

export function isSeverityOfPass(value: unknown): value is SeverityOfPass {
    return value === "Intent" || value === "Unaware";
}

export type Incident = {
    id: string;
    session_id: string;
    latitude: number | null;
    longitude: number | null;
    created_time: string | null;
    license_plate: string | null;
    best_image_id: string | null;
    injury: InjurySelection | null;
    severity_of_pass: SeverityOfPass | null;
    driver_present: number;
    driver_information: string | null;
    extra_comment: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
    vehicle_year: string | null;
    imageFiles: IncidentImage[];
    selectedImageId: string | null;
};

// This type/struct will hold GPS longitude/latitude
export type GpsCoordinates = {
    latitude: number;
    longitude: number;
};

// The incident will have an array of these.
export type IncidentImage = {
    id: string;
    fileName: string;
    uri: ImageSourcePropType;
};

// Required incident details used to determine whether the incident needs review.
export function isIncidentComplete(incident: Incident): boolean {
    const hasText = (value: unknown): value is string =>
        typeof value === "string" && value.trim().length > 0;

    return (
        isInjurySelection(incident.injury) &&
        isSeverityOfPass(incident.severity_of_pass) &&
        hasText(incident.license_plate) &&
        hasText(incident.vehicle_color)
    );
}
