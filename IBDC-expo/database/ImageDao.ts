// database/ImageDao.ts

import { getDatabase } from "./database";

export type AnalysisStatus =
    | "not_scheduled"
    | "pending"
    | "processing"
    | "completed"
    | "failed";

export type VehicleDetection = {
    label: "car" | "truck" | "bus" | "motorcycle";
    confidence: number;
    /** Pixel coordinates relative to the orientation-corrected original image. */
    boundingBox: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
};

export type IncidentImageRow = {
    id: string;
    incident_id: string;
    file_path: string;
    thumbnail_path: string | null;
    source: string;
    analysis_status: AnalysisStatus;
    vehicle_present: number | null;
    detections_json: string | null;
    analysis_model_id: string | null;
    confidence_threshold: number | null;
    analysis_timestamp: string | null;
    analysis_error: string | null;
};

export type VehicleAnalysisJob = Pick<
    IncidentImageRow,
    "id" | "file_path" | "analysis_model_id" | "confidence_threshold"
>;
// Creates a new image record connected to an incident.
// This stores the image file path and optional thumbnail path,
// but does not store the actual image binary in the database, however depending on protobuf impl. this may change.
export async function createIncidentImage(
    id: string,
    incidentId: string,
    filePath: string,
    thumbnailPath: string | null,
    source: string,
    initialAnalysisStatus: AnalysisStatus = "not_scheduled"
) {
    const database = await getDatabase();

    await database.runAsync(
        `INSERT INTO incident_images (
            id,
            incident_id,
            file_path,
            thumbnail_path,
            source,
            analysis_status
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        incidentId,
        filePath,
        thumbnailPath,
        source,
        initialAnalysisStatus
    );
}
//Retrieves all incident images from the database.
export async function getAllIncidentImages() {
    const database = await getDatabase();

    return await database.getAllAsync(`
        SELECT * FROM incident_images
    `);
}
//Retrieves all image records of a specific incident.
export async function getIncidentImagesByIncidentId(
    incidentId: string
): Promise<IncidentImageRow[]> {
    const database = await getDatabase();

    return await database.getAllAsync(
        `SELECT * FROM incident_images WHERE incident_id = ?`,
        incidentId
    );
}

export async function getIncidentImageById(
    imageId: string
): Promise<IncidentImageRow | null> {
    const database = await getDatabase();
    return database.getFirstAsync<IncidentImageRow>(
        `SELECT * FROM incident_images WHERE id = ?`,
        imageId
    );
}

/** Schedules an image unless it is completed or a failed job was not explicitly retried. */
export async function markAnalysisPending(
    imageId: string,
    modelId: string,
    confidenceThreshold: number,
    retryFailed = false
): Promise<boolean> {
    const database = await getDatabase();
    const image = await database.getFirstAsync<Pick<
        IncidentImageRow,
        "analysis_status" | "analysis_model_id" | "confidence_threshold"
    >>(
        `SELECT analysis_status, analysis_model_id, confidence_threshold
         FROM incident_images
         WHERE id = ?`,
        imageId
    );

    if (!image || image.analysis_status === "completed") {
        return false;
    }
    if (image.analysis_status === "failed" && !retryFailed) {
        return false;
    }
    if (
        image.analysis_status === "processing" &&
        image.analysis_model_id === modelId
    ) {
        return true;
    }
    if (
        image.analysis_status === "pending" &&
        image.analysis_model_id === modelId &&
        image.confidence_threshold === confidenceThreshold
    ) {
        return true;
    }

    await database.runAsync(
        `UPDATE incident_images
         SET analysis_status = 'pending',
             vehicle_present = NULL,
             detections_json = NULL,
             analysis_model_id = ?,
             confidence_threshold = ?,
             analysis_timestamp = NULL,
             analysis_error = NULL
         WHERE id = ?`,
        modelId,
        confidenceThreshold,
        imageId
    );
    return true;
}

/** Resets interrupted work and returns pending jobs for startup recovery. */
export async function recoverAnalysisJobs(): Promise<VehicleAnalysisJob[]> {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE incident_images
         SET analysis_status = 'pending',
             vehicle_present = NULL,
             detections_json = NULL,
             analysis_error = 'Analysis interrupted; queued for recovery.'
         WHERE analysis_status = 'processing'`
    );
    return database.getAllAsync<VehicleAnalysisJob>(
        `SELECT id, file_path, analysis_model_id, confidence_threshold
         FROM incident_images
         WHERE analysis_status = 'pending'
         ORDER BY rowid ASC`
    );
}

export async function markAnalysisProcessing(
    imageId: string,
    modelId: string
): Promise<boolean> {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE incident_images
         SET analysis_status = 'processing',
             vehicle_present = NULL,
             detections_json = NULL,
             analysis_timestamp = NULL,
             analysis_error = NULL
         WHERE id = ?
           AND analysis_status = 'pending'
           AND analysis_model_id = ?`,
        imageId,
        modelId
    );
    return result.changes > 0;
}

export async function saveAnalysisResult(
    imageId: string,
    modelId: string,
    detections: VehicleDetection[]
): Promise<boolean> {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE incident_images
         SET analysis_status = 'completed',
             vehicle_present = ?,
             detections_json = ?,
             analysis_timestamp = ?,
             analysis_error = NULL
         WHERE id = ?
           AND analysis_status = 'processing'
           AND analysis_model_id = ?`,
        detections.length > 0 ? 1 : 0,
        JSON.stringify(detections),
        new Date().toISOString(),
        imageId,
        modelId
    );
    return result.changes > 0;
}

export async function saveAnalysisFailure(
    imageId: string,
    modelId: string,
    message: string
): Promise<boolean> {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE incident_images
         SET analysis_status = 'failed',
             vehicle_present = NULL,
             detections_json = NULL,
             analysis_timestamp = ?,
             analysis_error = ?
         WHERE id = ?
           AND analysis_status = 'processing'
           AND analysis_model_id = ?`,
        new Date().toISOString(),
        message,
        imageId,
        modelId
    );
    return result.changes > 0;
}
//Deletes all images connected to a specific incident.
export async function deleteImagesByIncidentId(incidentId: string) {
    const database = await getDatabase();

    await database.runAsync(
        `DELETE FROM incident_images WHERE incident_id = ?`,
        incidentId
    );
}

// Helper for mock images.
// Actual device images should eventually use local file path URIs instead.
export function getMockImageSource(filePath: string) {
    switch (filePath) {
        case "example1":
            return require("@/assets/images/example.jpg");
        case "example2":
            return require("@/assets/images/example2.jpg");
        case "example3":
            return require("@/assets/images/example3.jpg");
        case "example4":
            return require("@/assets/images/example4.jpg");
        default:
            return null;
    }
}