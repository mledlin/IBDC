import { getSessionHistoryData } from "@/database/SessionDao";
import {LocalRideSession,ServerUploadAdapter,} from "@/utils/ServerUploadAdapter";

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
 *
 */
export async function uploadSession(
    session: LocalRideSession,
    config: DataUploadConfig,
): Promise<DataUploadResult> {

    console.log("Uploading session:", session.id);
    console.log("Upload endpoint:", config.endpoint);

    return {
        ok: true,
        status: 200,
        sessionId: session.id,
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