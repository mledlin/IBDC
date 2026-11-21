
import { getSessionHistoryData } from "@/database/SessionDao";
import { convertImage } from "@/utils/ImageConverter";
import { SERVER_CONFIG } from "@/utils/ServerConfig";
import { File } from "expo-file-system";
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

    //console.log("Prepared Images:", adaptedSession.files);
    //console.log("Image Count:", adaptedSession.files.length);

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

        for (const file of adaptedSession.files) {
            const convertedUri = await convertImage(file.uri);

            const imageFile = new File(convertedUri);

            if (!imageFile.exists) {
                throw new Error(
                    `Image file does not exist: ${convertedUri}`
                );
            }

            formData.append(
                file.fieldName,
                imageFile
            );
        }

        // Allow Expo to generate the multipart boundary.
        Object.keys(headers).forEach((key) => {
            if (key.toLowerCase() === "content-type") {
                delete headers[key];
            }
        });

        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(adaptedSession.payload);
    }

    //console.log("Request Headers:", headers);
    //console.log(
    //"Request Body Type:",
    //body instanceof FormData ? "FormData" : "JSON"
    //);

    /**
     * Abort the request if the server does not respond
     * within the configured timeout.
     */
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, SERVER_CONFIG.timeoutMs);

    let response: Response;

    try {
        response = await fetch(config.endpoint, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
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
    } catch (error) {
        if (controller.signal.aborted) {
            throw new Error(
                `Upload timed out after ${SERVER_CONFIG.timeoutMs / 1000} seconds.`,
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
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
