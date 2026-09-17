export type LocalRideSession = {
    id: string;
    [key: string]: unknown;
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
 * Defines how local session data is converted
 * into the format expected by the server.
 */
export interface ServerUploadAdapter {
    adaptSession(session: LocalRideSession): AdaptedSession;
}

/**
 * Default adapter for ride session uploads, 
 * can be updated later on once confirmed by server team.
 */
export class DefaultServerUploadAdapter implements ServerUploadAdapter {

    adaptSession(session: LocalRideSession): AdaptedSession {

        return {
            payload: {
                sessionId: session.id,
                data: session,
            },
            files: [],
        };
    }
}