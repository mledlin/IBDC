import {createSession, DatabaseSessionRow, getAllSessions} from "@/database/SessionDao";
import { createIncident } from "@/database/IncidentDao";
import { createIncidentImage} from "@/database/ImageDao";
import type { SessionInfo, SessionPersistence } from "@/hooks/SessionManager"

export type DAOAccessor = {
    createSession: (sessionId: string, createdTime: string) => Promise<void>,
    createIncident: (id: string,
                     sessionId: string,
                     latitude: number | null,
                     longitude: number | null,
                     licensePlate: string | null,
                     bestImageId: string | null,
                     injurySeverity: string | null,
                     driverPresent: number,
                     driverInformation: string | null,
                     extraComment: string | null,
                     vehicleMake: string | null,
                     vehicleModel: string | null,
                     vehicleColor: string | null,
                     vehicleYear: string | null,
                     createdTime: string) => Promise<void>,
    createIncidentImage: (id: string,
                          incidentId: string,
                          filePath: string,
                          thumbnail: any,
                          source: string) => Promise<void>,
    getAllSessions(): Promise<SessionInfo[]>

}

export class DAOAdapter implements DAOAccessor, SessionPersistence {

    public async createSession(sessionId: string, createdTime: string): Promise<void> {
        await createSession(sessionId, createdTime);
    }

    public async createIncident(id: string,
                                sessionId: string,
                                latitude: number | null,
                                longitude: number | null,
                                licensePlate: string | null,
                                bestImageId: string | null,
                                injurySeverity: string | null,
                                driverPresent: number,
                                driverInformation: string | null,
                                extraComment: string | null,
                                vehicleMake: string | null,
                                vehicleModel: string | null,
                                vehicleColor: string | null,
                                vehicleYear: string | null,
                                createdTime: string): Promise<void> {
        await createIncident(id, sessionId, latitude, longitude, licensePlate, bestImageId,
            injurySeverity, driverPresent, driverInformation, extraComment,
            vehicleMake, vehicleModel, vehicleColor, vehicleYear, createdTime)

    }

    public async createIncidentImage(id: string,
                                     incidentId: string,
                                     filePath: string,
                                     thumbnail: any,
                                     source: string): Promise<void> {
        await createIncidentImage(id, incidentId, filePath, thumbnail, source)
    }

    public async getAllSessions(): Promise<SessionInfo[]> {
        const stored_sessions: DatabaseSessionRow[] = await getAllSessions();

        return stored_sessions.map((session:DatabaseSessionRow): SessionInfo => ({
            id: session.id,
            createdTime: session.created_time,
        }));
    }

}

