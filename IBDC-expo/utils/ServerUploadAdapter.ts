export type LocalRideSession = {
    id: string;
    incidents?: LocalIncident[];
    [key: string]: unknown;
};

export type LocalIncident = {
    id: string;
    imageFiles?: LocalImage[];
    best_image_id?: string | null;
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
            //Incidents without best image will be skipped
            if(!incident.best_image_id){
                return;
            }

            //Locating best image
            const bestImage = incident.imageFiles?.find(
                (image) => image.id === incident.best_image_id
            );

            //Skip those without path/dne
            if(!bestImage?.file_path){
                return;
            }

            //Excludes mock images due to searching by path. This will also need to be revisited when BLE image transfer begins occuring
            if(!bestImage.file_path.startsWith("file://")){
                return;
            }

            files.push({
                fieldName: "images",
                uri: bestImage.file_path,
                name: `incident-${incident.id}-${bestImage.id}`,
                type: "image/jpeg",
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