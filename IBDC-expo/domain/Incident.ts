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

import {Session} from "@/domain/Session";

export type Incident = {
    imageFiles: IncidentImage[];
    selectedImageId: String | null;
    gpsLocation: GpsCoordinates | null;
    gpsTimestamp: Date | null;
    licensePlate: string | null;
    riderNotes: string | null;
    session: Session | null;
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
    uri: string;
};

// This is a potential check to verify an incident is ready to be published as a PDF or by
// other means. All data should be filled in to be true.
export function isIncidentComplete(incident: Incident): boolean {
    return (
        incident.imageFiles.length > 0 &&
        incident.selectedImageId !== null &&
        incident.gpsLocation !== null &&
        incident.gpsTimestamp !== null &&
            incident.licensePlate !== null && incident.licensePlate.trim().length > 0 &&
            incident.riderNotes !== null && incident.riderNotes.trim().length > 0
    );
}
