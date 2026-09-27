export type LocalRideSession = {
    id: string;
    incidents?: LocalIncident[];
    [key: string]: unknown;
};

export type LocalIncident = {
    id: string;
    imageFiles?: LocalImage[];
    [key: string]: unknown;
};

export type LocalImage = {
    id: string;
    file_path: string;
};

export type ServerUploadPayload = {
    sessionId: string;
    data: unknown;
};

export type UploadFile = {
    fieldName: string;
    uri: string;
    name: string;
    type: string;
};

export type AdaptedSession = {
    payload: ServerUploadPayload;
    files: UploadFile[];
};

/**
 * Defines how local session data is converted into format expected by the server.
 */
export interface ServerUploadAdapter {
    adaptSession(session: LocalRideSession): AdaptedSession;
}

/**
 * Default adapter for ride session uploads.
 * Can be updated once the server side is confirmed.
 */
export class DefaultServerUploadAdapter implements ServerUploadAdapter {

    adaptSession(session: LocalRideSession): AdaptedSession {

        const files: UploadFile[] = [];

        session.incidents?.forEach((incident) => {
            incident.imageFiles?.forEach((image, index) => {

                if (!image.file_path) {
                    return;
                }

                files.push({
                    fieldName: "images",
                    uri: image.file_path,
                    name: `incident-${incident.id}-${index}.jpg`,
                    type: "image/jpeg",
                });
            });
        });

        return {
            payload: {
                sessionId: session.id,
                data: session,
            },
            files,
        };
    }
}