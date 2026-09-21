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

    console.log("Uploading session:", session.id);
    console.log("Upload endpoint:", config.endpoint);
    console.log("Adapted session:", adaptedSession);

    return {
        ok: true,
        status: 200,
        sessionId: session.id,
        responseBody: adaptedSession.payload,
    };
}

/**
 * Finds a session from the local database and uploads it.
 */
export async function uploadSession(
    session: LocalRideSession,
    config: DataUploadConfig,
): Promise<DataUploadResult> {

    const adapter = config.adapter ?? new DefaultServerUploadAdapter();
    const adaptedSession = adapter.adaptSession(session);

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config.headers ?? {}),
    };

    const response = await fetch(config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(adaptedSession.payload),
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
            `Failed to upload session ${session.id}. Status: ${response.status}`,
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