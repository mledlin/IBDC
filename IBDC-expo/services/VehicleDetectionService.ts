import { decode } from "jpeg-js";
import { toByteArray } from "base64-js";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
    getIncidentImageById,
    markAnalysisPending,
    markAnalysisProcessing,
    recoverAnalysisJobs,
    saveAnalysisFailure,
    saveAnalysisResult,
    type VehicleDetection,
} from "@/database/ImageDao";
import type { Tensor, TfliteModel } from "react-native-fast-tflite";
import { COCO_LABELS } from "./COCOLabelMap";

export const VEHICLE_MODEL_ID = "mediapipe-efficientdet-lite0-float32-1";
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.3;
export const VEHICLE_MODEL_INPUT_SIZE = 320;
const MODEL_LABEL_COUNT = 90;
const MODEL_BOX_COUNT = 19_206;
const VEHICLE_LABELS: readonly VehicleDetection["label"][] = [
    "car",
    "truck",
    "bus",
    "motorcycle",
];
const COCO_VEHICLE_CLASSES = VEHICLE_LABELS.map((label) => {
    const classIndex = COCO_LABELS.indexOf(label);
    if (classIndex < 0) {
        throw new Error(`Vehicle label "${label}" is missing from the COCO label map.`);
    }
    return { classIndex, label };
});

const ANCHOR_ASPECT_RATIOS = [
    [1, 1],
    [1.4, 0.7],
    [0.7, 1.4],
] as const;
const ANCHOR_SCALES = 3;
const ANCHOR_BASE_SCALE = 4;
const BOX_CENTER_SCALE = 10;
const BOX_SIZE_SCALE = 5;
const NMS_IOU_THRESHOLD = 0.5;

type ModelAnchor = {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
};

export type ImagePreprocessingTransform = {
    originalWidth: number;
    originalHeight: number;
    resizedWidth: number;
    resizedHeight: number;
    padLeft: number;
    padTop: number;
};

export type AnalysisBadge = {
    label: string;
    color: string;
};

export function getAnalysisBadge(
    status: string | null | undefined,
    vehiclePresent: number | null
): AnalysisBadge {
    switch (status) {
        case "pending":
        case "processing":
            return { label: "Analyzing…", color: "#7C3AED" };
        case "completed":
            if (vehiclePresent === 1) {
                return { label: "AI: Vehicle detected", color: "#166534" };
            }
            return vehiclePresent === 0
                ? { label: "AI: No vehicle detected", color: "#1D4ED8" }
                : { label: "AI: Analysis unavailable", color: "#B91C1C" };
        case "failed":
            return { label: "AI: Analysis unavailable", color: "#B91C1C" };
        default:
            return { label: "Not analyzed", color: "#475569" };
    }
}

type QueueJob = {
    imageId: string;
    imageUri: string;
    modelId: string;
    confidenceThreshold: number;
};

/** A FIFO queue that runs one job at a time and deduplicates queued and active jobs. */
export class SequentialAnalysisQueue {
    private readonly jobs: QueueJob[] = [];
    private readonly jobKeys = new Set<string>();
    private readonly idleWaiters: Array<() => void> = [];
    private isProcessing = false;

    constructor(private readonly processJob: (job: QueueJob) => Promise<void>) {}

    enqueue(job: QueueJob): boolean {
        const key = `${job.imageId}:${job.modelId}`;
        if (this.jobKeys.has(key)) {
            return false;
        }
        this.jobKeys.add(key);
        this.jobs.push(job);
        void this.processNext();
        return true;
    }

    whenIdle(): Promise<void> {
        if (!this.isProcessing && this.jobs.length === 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => this.idleWaiters.push(resolve));
    }

    private async processNext(): Promise<void> {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        while (this.jobs.length > 0) {
            const job = this.jobs.shift();
            if (!job) {
                continue;
            }
            const key = `${job.imageId}:${job.modelId}`;
            try {
                await this.processJob(job);
            } catch (error) {
                console.error(
                    `VehicleDetectionService: unhandled analysis failure for image ${job.imageId}:`,
                    error
                );
            } finally {
                this.jobKeys.delete(key);
            }
        }
        this.isProcessing = false;
        this.idleWaiters.splice(0).forEach((resolve) => resolve());
    }
}

function generateEfficientDetLite0Anchors(): ModelAnchor[] {
    const anchors: ModelAnchor[] = [];
    for (let level = 3; level <= 7; level += 1) {
        const stride = 2 ** level;
        const featureSize = Math.ceil(VEHICLE_MODEL_INPUT_SIZE / stride);
        for (let y = 0; y < featureSize; y += 1) {
            for (let x = 0; x < featureSize; x += 1) {
                for (let scale = 0; scale < ANCHOR_SCALES; scale += 1) {
                    const scaledAnchor = ANCHOR_BASE_SCALE * stride *
                        2 ** (scale / ANCHOR_SCALES);
                    for (const [widthRatio, heightRatio] of ANCHOR_ASPECT_RATIOS) {
                        anchors.push({
                            centerX: ((x + 0.5) * stride) / VEHICLE_MODEL_INPUT_SIZE,
                            centerY: ((y + 0.5) * stride) / VEHICLE_MODEL_INPUT_SIZE,
                            width:
                                (scaledAnchor * widthRatio) /
                                VEHICLE_MODEL_INPUT_SIZE,
                            height:
                                (scaledAnchor * heightRatio) /
                                VEHICLE_MODEL_INPUT_SIZE,
                        });
                    }
                }
            }
        }
    }
    if (anchors.length !== MODEL_BOX_COUNT) {
        throw new Error(
            `EfficientDet-Lite0 anchor count mismatch: expected ${MODEL_BOX_COUNT}, got ${anchors.length}`
        );
    }
    return anchors;
}

const efficientDetLite0Anchors = generateEfficientDetLite0Anchors();

function intersectionOverUnion(
    first: VehicleDetection["boundingBox"],
    second: VehicleDetection["boundingBox"]
): number {
    const intersectionWidth = Math.max(
        0,
        Math.min(first.right, second.right) - Math.max(first.left, second.left)
    );
    const intersectionHeight = Math.max(
        0,
        Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
    );
    const intersection = intersectionWidth * intersectionHeight;
    const firstArea = Math.max(0, first.right - first.left) *
        Math.max(0, first.bottom - first.top);
    const secondArea = Math.max(0, second.right - second.left) *
        Math.max(0, second.bottom - second.top);
    const union = firstArea + secondArea - intersection;
    return union > 0 ? intersection / union : 0;
}

export function parseEfficientDetLite0Outputs(
    scoreBuffer: ArrayBuffer,
    boxBuffer: ArrayBuffer,
    transform: ImagePreprocessingTransform,
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD
): VehicleDetection[] {
    if (confidenceThreshold < 0 || confidenceThreshold > 1) {
        throw new Error("Confidence threshold must be between 0 and 1.");
    }
    const scores = new Float32Array(scoreBuffer);
    const boxes = new Float32Array(boxBuffer);
    if (
        scores.length !== MODEL_BOX_COUNT * MODEL_LABEL_COUNT ||
        boxes.length !== MODEL_BOX_COUNT * 4
    ) {
        throw new Error(
            `Unexpected EfficientDet-Lite0 output sizes: scores=${scores.length}, boxes=${boxes.length}`
        );
    }

    const detections: VehicleDetection[] = [];
    const scaleX = transform.originalWidth / transform.resizedWidth;
    const scaleY = transform.originalHeight / transform.resizedHeight;
    for (let anchorIndex = 0; anchorIndex < MODEL_BOX_COUNT; anchorIndex += 1) {
        const matchingCategories: Array<{
            label: VehicleDetection["label"];
            confidence: number;
        }> = [];
        for (const category of COCO_VEHICLE_CLASSES) {
            const confidence =
                scores[anchorIndex * MODEL_LABEL_COUNT + category.classIndex];
            if (confidence >= confidenceThreshold) {
                matchingCategories.push({
                    label: category.label,
                    confidence,
                });
            }
        }
        if (matchingCategories.length === 0) {
            continue;
        }

        const anchor = efficientDetLite0Anchors[anchorIndex];
        const boxOffset = anchorIndex * 4;
        const centerY =
            (boxes[boxOffset] / BOX_CENTER_SCALE) * anchor.height +
            anchor.centerY;
        const centerX =
            (boxes[boxOffset + 1] / BOX_CENTER_SCALE) * anchor.width +
            anchor.centerX;
        const height =
            Math.exp(boxes[boxOffset + 2] / BOX_SIZE_SCALE) * anchor.height;
        const width =
            Math.exp(boxes[boxOffset + 3] / BOX_SIZE_SCALE) * anchor.width;
        const modelLeft = centerX - width / 2;
        const modelTop = centerY - height / 2;
        const modelRight = centerX + width / 2;
        const modelBottom = centerY + height / 2;
        const boundingBox = {
            left: Math.max(
                0,
                Math.min(
                    transform.originalWidth,
                    (modelLeft * VEHICLE_MODEL_INPUT_SIZE - transform.padLeft) *
                        scaleX
                )
            ),
            top: Math.max(
                0,
                Math.min(
                    transform.originalHeight,
                    (modelTop * VEHICLE_MODEL_INPUT_SIZE - transform.padTop) *
                        scaleY
                )
            ),
            right: Math.max(
                0,
                Math.min(
                    transform.originalWidth,
                    (modelRight * VEHICLE_MODEL_INPUT_SIZE - transform.padLeft) *
                        scaleX
                )
            ),
            bottom: Math.max(
                0,
                Math.min(
                    transform.originalHeight,
                    (modelBottom * VEHICLE_MODEL_INPUT_SIZE - transform.padTop) *
                        scaleY
                )
            ),
        };
        if (
            !Number.isFinite(centerX + centerY + width + height) ||
            boundingBox.right <= boundingBox.left ||
            boundingBox.bottom <= boundingBox.top
        ) {
            continue;
        }

        for (const category of matchingCategories) {
            detections.push({
                label: category.label,
                confidence: category.confidence,
                boundingBox,
            });
        }
    }

    const filteredDetections: VehicleDetection[] = [];
    for (const { label } of COCO_VEHICLE_CLASSES) {
        const candidates = detections
            .filter((detection) => detection.label === label)
            .sort((first, second) => second.confidence - first.confidence);
        const selected: VehicleDetection[] = [];
        for (const candidate of candidates) {
            if (
                selected.every(
                    (prior) =>
                        intersectionOverUnion(
                            prior.boundingBox,
                            candidate.boundingBox
                        ) <= NMS_IOU_THRESHOLD
                )
            ) {
                selected.push(candidate);
            }
        }
        filteredDetections.push(...selected);
    }
    return filteredDetections.sort(
        (first, second) => second.confidence - first.confidence
    );
}

export function createInputTensor(
    rgba: Uint8Array,
    resizedWidth: number,
    resizedHeight: number
): { input: ArrayBuffer; padLeft: number; padTop: number } {
    if (
        resizedWidth <= 0 ||
        resizedHeight <= 0 ||
        resizedWidth > VEHICLE_MODEL_INPUT_SIZE ||
        resizedHeight > VEHICLE_MODEL_INPUT_SIZE ||
        rgba.length !== resizedWidth * resizedHeight * 4
    ) {
        throw new Error("Decoded image dimensions or pixel data are invalid.");
    }
    const padLeft = Math.floor(
        (VEHICLE_MODEL_INPUT_SIZE - resizedWidth) / 2
    );
    const padTop = Math.floor(
        (VEHICLE_MODEL_INPUT_SIZE - resizedHeight) / 2
    );
    const tensor = new Float32Array(
        VEHICLE_MODEL_INPUT_SIZE * VEHICLE_MODEL_INPUT_SIZE * 3
    );

    for (let y = 0; y < resizedHeight; y += 1) {
        for (let x = 0; x < resizedWidth; x += 1) {
            const sourceOffset = (y * resizedWidth + x) * 4;
            const targetOffset =
                ((y + padTop) * VEHICLE_MODEL_INPUT_SIZE + x + padLeft) * 3;
            tensor[targetOffset] = (rgba[sourceOffset] - 127.5) / 127.5;
            tensor[targetOffset + 1] =
                (rgba[sourceOffset + 1] - 127.5) / 127.5;
            tensor[targetOffset + 2] =
                (rgba[sourceOffset + 2] - 127.5) / 127.5;
        }
    }

    return { input: tensor.buffer, padLeft, padTop };
}

async function prepareImageInput(imageUri: string): Promise<{
    input: ArrayBuffer;
    transform: ImagePreprocessingTransform;
}> {
    const orientedImage = await ImageManipulator.manipulate(imageUri).renderAsync();
    const originalWidth = orientedImage.width;
    const originalHeight = orientedImage.height;
    if (originalWidth <= 0 || originalHeight <= 0) {
        throw new Error("Image has invalid dimensions.");
    }

    const resizeScale = Math.min(
        VEHICLE_MODEL_INPUT_SIZE / originalWidth,
        VEHICLE_MODEL_INPUT_SIZE / originalHeight
    );
    const resizedWidth = Math.max(1, Math.round(originalWidth * resizeScale));
    const resizedHeight = Math.max(1, Math.round(originalHeight * resizeScale));
    const resizedImage = await ImageManipulator.manipulate(imageUri)
        .resize({ width: resizedWidth, height: resizedHeight })
        .renderAsync();
    const jpeg = await resizedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 1,
        base64: true,
    });
    if (!jpeg.base64) {
        throw new Error("Image preprocessing did not produce JPEG data.");
    }

    const decoded = decode(toByteArray(jpeg.base64), {
        useTArray: true,
        formatAsRGBA: true,
        maxMemoryUsageInMB: 128,
    });
    if (decoded.width !== resizedWidth || decoded.height !== resizedHeight) {
        throw new Error(
            `Resized image dimensions changed unexpectedly: ${decoded.width}x${decoded.height}`
        );
    }

    const { input, padLeft, padTop } = createInputTensor(
        decoded.data,
        resizedWidth,
        resizedHeight
    );
    return {
        input,
        transform: {
            originalWidth,
            originalHeight,
            resizedWidth,
            resizedHeight,
            padLeft,
            padTop,
        },
    };
}

function findOutputTensorIndex(
    outputs: Tensor[],
    tensorName: string,
    shape: number[]
): number {
    const index = outputs.findIndex(
        (tensor) =>
            tensor.name === tensorName &&
            tensor.dataType === "float32" &&
            tensor.shape.length === shape.length &&
            tensor.shape.every((dimension, position) => dimension === shape[position])
    );
    if (index === -1) {
        throw new Error(
            `Unexpected model output tensor metadata; expected ${tensorName} ${shape.join("x")} float32.`
        );
    }
    return index;
}

function getModelOutputIndexes(model: TfliteModel): {
    scoreIndex: number;
    boxIndex: number;
} {
    return {
        scoreIndex: findOutputTensorIndex(
            model.outputs,
            "StatefulPartitionedCall:1",
            [1, MODEL_BOX_COUNT, MODEL_LABEL_COUNT]
        ),
        boxIndex: findOutputTensorIndex(
            model.outputs,
            "StatefulPartitionedCall:0",
            [1, MODEL_BOX_COUNT, 4]
        ),
    };
}

function validateModelInput(model: TfliteModel): void {
    const input = model.inputs[0];
    if (
        model.inputs.length !== 1 ||
        !input ||
        input.name !== "serving_default_images:0" ||
        input.dataType !== "float32" ||
        input.shape.join(",") !== "1,320,320,3"
    ) {
        throw new Error(
            "Unexpected EfficientDet-Lite0 input tensor; expected serving_default_images:0 [1,320,320,3] float32."
        );
    }
}

export class VehicleDetectionService {
    readonly modelId = VEHICLE_MODEL_ID;
    private modelPromise: Promise<TfliteModel> | null = null;
    private recoveryPromise: Promise<void> | null = null;
    private readonly confidenceThreshold: number;
    private readonly queue: SequentialAnalysisQueue;
    private readonly listeners = new Set<(imageId: string) => void>();

    constructor(confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD) {
        if (confidenceThreshold < 0 || confidenceThreshold > 1) {
            throw new Error("Confidence threshold must be between 0 and 1.");
        }
        this.confidenceThreshold = confidenceThreshold;
        this.queue = new SequentialAnalysisQueue((job) => this.processJob(job));
    }

    subscribe(listener: (imageId: string) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    async scheduleImage(imageId: string, imageUri: string): Promise<boolean> {
        const scheduled = await markAnalysisPending(
            imageId,
            this.modelId,
            this.confidenceThreshold
        );
        if (!scheduled) {
            return false;
        }
        this.notifyListeners(imageId);
        return this.queue.enqueue({
            imageId,
            imageUri,
            modelId: this.modelId,
            confidenceThreshold: this.confidenceThreshold,
        });
    }

    async retryFailedImage(imageId: string): Promise<boolean> {
        const image = await getIncidentImageById(imageId);
        if (!image || image.analysis_status !== "failed") {
            return false;
        }
        const scheduled = await markAnalysisPending(
            imageId,
            this.modelId,
            this.confidenceThreshold,
            true
        );
        if (!scheduled) {
            return false;
        }
        this.notifyListeners(imageId);
        return this.queue.enqueue({
            imageId,
            imageUri: image.file_path,
            modelId: this.modelId,
            confidenceThreshold: this.confidenceThreshold,
        });
    }

    recoverPendingJobs(): Promise<void> {
        if (!this.recoveryPromise) {
            this.recoveryPromise = this.recoverPersistedJobs().catch((error) => {
                this.recoveryPromise = null;
                throw error;
            });
        }
        return this.recoveryPromise;
    }

    private async recoverPersistedJobs(): Promise<void> {
        const jobs = await recoverAnalysisJobs();
        for (const job of jobs) {
            const confidenceThreshold =
                job.analysis_model_id === this.modelId &&
                job.confidence_threshold !== null
                    ? job.confidence_threshold
                    : this.confidenceThreshold;
            const scheduled = await markAnalysisPending(
                job.id,
                this.modelId,
                confidenceThreshold
            );
            if (!scheduled) {
                continue;
            }
            this.queue.enqueue({
                imageId: job.id,
                imageUri: job.file_path,
                modelId: this.modelId,
                confidenceThreshold,
            });
            this.notifyListeners(job.id);
        }
    }

    private async getModel(): Promise<TfliteModel> {
        if (!this.modelPromise) {
            this.modelPromise = (async () => {
                const { loadTensorflowModel } = await import(
                    "react-native-fast-tflite"
                );
                const modelAsset = require(
                    "@/assets/models/efficientdet_lite0_float32_1.tflite"
                ) as number;
                const model = await loadTensorflowModel(modelAsset, []);
                validateModelInput(model);
                getModelOutputIndexes(model);
                return model;
            })().catch((error) => {
                this.modelPromise = null;
                throw error;
            });
        }
        return this.modelPromise;
    }

    private async processJob(job: QueueJob): Promise<void> {
        const started = await markAnalysisProcessing(job.imageId, job.modelId);
        if (!started) {
            return;
        }
        this.notifyListeners(job.imageId);
        try {
            const model = await this.getModel();
            const { input, transform } = await prepareImageInput(job.imageUri);
            const outputs = await model.run([input]);
            const { scoreIndex, boxIndex } = getModelOutputIndexes(model);
            const detections = parseEfficientDetLite0Outputs(
                outputs[scoreIndex],
                outputs[boxIndex],
                transform,
                job.confidenceThreshold
            );
            const saved = await saveAnalysisResult(
                job.imageId,
                job.modelId,
                detections
            );
            if (saved) {
                this.notifyListeners(job.imageId);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            try {
                const saved = await saveAnalysisFailure(
                    job.imageId,
                    job.modelId,
                    message
                );
                if (saved) {
                    this.notifyListeners(job.imageId);
                }
            } catch (saveError) {
                console.error(
                    `VehicleDetectionService: failed to persist analysis error for image ${job.imageId}:`,
                    saveError
                );
            }
            console.error(
                `VehicleDetectionService: analysis failed for image ${job.imageId}:`,
                error
            );
        }
    }

    private notifyListeners(imageId: string): void {
        for (const listener of this.listeners) {
            try {
                listener(imageId);
            } catch (error) {
                console.error(
                    "VehicleDetectionService: analysis update listener failed:",
                    error
                );
            }
        }
    }
}

export const vehicleDetectionService = new VehicleDetectionService();
