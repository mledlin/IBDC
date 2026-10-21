import {
    createIncident,
} from "./IncidentDao";

import {
    createIncidentImage,
} from "./ImageDao";

import {
    createSession,
} from "./SessionDao";

import type {
    MockDataPersistence,
} from "@/services/MockDataService";

/**
 * SQLite persistence used by mock-data
 */
export const sqliteMockDataPersistence:
    MockDataPersistence = {

    async saveSession(session) {
        await createSession(
            session.id,
            session.createdTime,
        );
    },

    async saveIncident(incident) {
        await createIncident(
            incident.id,
            incident.sessionId,
            incident.latitude,
            incident.longitude,
            incident.licensePlate,
            incident.bestImageId,
            incident.injurySeverity,
            incident.driverPresent,
            incident.driverInformation,
            incident.extraComment,
            incident.vehicleMake,
            incident.vehicleModel,
            incident.vehicleColor,
            incident.vehicleYear,
            incident.createdTime,
        );
    },

    async saveImage(image) {
        await createIncidentImage(
            image.id,
            image.incidentId,
            image.filePath,
            image.thumbnailPath,
            image.source,
        );
    },
};