import { getSessionHistoryData } from "@/database/SessionDao";
import {
    DefaultServerUploadAdapter,
    LocalRideSession,
    ServerUploadAdapter,
} from "@/utils/ServerUploadAdapter";

export type DataUploadConfig = {
    endpoint: string;
    headers?: Record<string, string>;
    adapter?: ServerUploadAdapter;
};

export type DataUploadResult = {
    ok: boolean;
    status: number;
    sessionId: string;
    responseBody?: unknown;
};

/**
 * Uploads a ride session to the server.
 */
export async function uploadSession(
    session: LocalRideSession,
    config: DataUploadConfig,
): Promise<DataUploadResult> {

    const adapter = config.adapter ?? new DefaultServerUploadAdapter();
    const adaptedSession = adapter.adaptSession(session);

    const headers: Record<string, string> = {
        ...(config.headers ?? {}),
    };

    let body: BodyInit;

    if (adaptedSession.files.length > 0) {
        const formData = new FormData();

        formData.append(
            "metadata",
            JSON.stringify(adaptedSession.payload),
        );

        adaptedSession.files.forEach((file) => {
            formData.append(
                file.fieldName,
                {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                } as any,
            );
        });

        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(adaptedSession.payload);
    }

    const response = await fetch(config.endpoint, {
        method: "POST",
        headers,
        body,
    });

    let responseBody: unknown;

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        responseBody = await response.json();
    } else {
        const text = await response.text();
        responseBody = text || undefined;
    }

    if (!response.ok) {
        throw new Error(
            `Failed to upload session ${session.id}. Status: ${response.status}. ` +
            `Response: ${JSON.stringify(responseBody)}`,
        );
    }

    return {
        ok: true,
        status: response.status,
        sessionId: session.id,
        responseBody,
    };
}

/**
 * Finds a session from the local database and uploads it.
 */
export async function uploadSessionById(
    sessionId: string,
    config: DataUploadConfig,
): Promise<DataUploadResult> {

    const sessions = (await getSessionHistoryData()) as LocalRideSession[];

    const session = sessions.find(
        (session) => session.id === sessionId,
    );

    if (!session) {
        throw new Error(`Session ${sessionId} was not found.`);
    }

    return uploadSession(session, config);
}

/**
 * Uploads all currently stored ride sessions.
 */
export async function uploadAllSessions(
    config: DataUploadConfig,
): Promise<DataUploadResult[]> {

    const sessions = (await getSessionHistoryData()) as LocalRideSession[];
    const results: DataUploadResult[] = [];

    for (const session of sessions) {
        const result = await uploadSession(session, config);
        results.push(result);
    }

    return results;
}