import {
    DEFAULT_CONFIDENCE_THRESHOLD,
    createInputTensor,
    getAnalysisBadge,
    parseEfficientDetLite0Outputs,
    SequentialAnalysisQueue,
    VehicleDetectionService,
} from "@/services/VehicleDetectionService";
import { recoverAnalysisJobs } from "@/database/ImageDao";
import { COCO_LABELS } from "@/services/COCOLabelMap";

jest.mock("@/database/ImageDao", () => ({
    getIncidentImageById: jest.fn(),
    markAnalysisPending: jest.fn(),
    markAnalysisProcessing: jest.fn(),
    recoverAnalysisJobs: jest.fn().mockResolvedValue([]),
    saveAnalysisFailure: jest.fn(),
    saveAnalysisResult: jest.fn(),
}));

describe("SequentialAnalysisQueue", () => {
    test("deduplicates queued and running jobs and processes sequentially", async () => {
        const order: string[] = [];
        let activeJobs = 0;
        let maximumActiveJobs = 0;
        let releaseFirstJob: (() => void) | undefined;
        const firstJobStarted = new Promise<void>((resolve) => {
            releaseFirstJob = resolve;
        });
        const queue = new SequentialAnalysisQueue(async (job) => {
            activeJobs += 1;
            maximumActiveJobs = Math.max(maximumActiveJobs, activeJobs);
            order.push(`start:${job.imageId}`);
            if (job.imageId === "one") {
                releaseFirstJob?.();
                await new Promise((resolve) => setTimeout(resolve, 5));
            }
            order.push(`end:${job.imageId}`);
            activeJobs -= 1;
        });
        const firstJob = {
            imageId: "one",
            imageUri: "file://one.jpg",
            modelId: "model",
            confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
        };

        expect(queue.enqueue(firstJob)).toBe(true);
        await firstJobStarted;
        expect(queue.enqueue(firstJob)).toBe(false);
        expect(
            queue.enqueue({
                ...firstJob,
                imageId: "two",
                imageUri: "file://two.jpg",
            })
        ).toBe(true);
        await queue.whenIdle();

        expect(maximumActiveJobs).toBe(1);
        expect(order).toEqual([
            "start:one",
            "end:one",
            "start:two",
            "end:two",
        ]);
    });

    test("continues to later jobs when an analysis fails", async () => {
        const processed: string[] = [];
        const logError = jest.spyOn(console, "error").mockImplementation(() => {});
        const queue = new SequentialAnalysisQueue(async (job) => {
            processed.push(job.imageId);
            if (job.imageId === "failed") {
                throw new Error("test failure");
            }
        });

        queue.enqueue({
            imageId: "failed",
            imageUri: "file://failed.jpg",
            modelId: "model",
            confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
        });
        queue.enqueue({
            imageId: "next",
            imageUri: "file://next.jpg",
            modelId: "model",
            confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
        });
        await queue.whenIdle();

        expect(processed).toEqual(["failed", "next"]);
        expect(logError).toHaveBeenCalledTimes(1);
        logError.mockRestore();
    });
});

test("runs persisted-job recovery only once for repeated startup calls", async () => {
    const service = new VehicleDetectionService();

    await Promise.all([
        service.recoverPendingJobs(),
        service.recoverPendingJobs(),
    ]);

    expect(recoverAnalysisJobs).toHaveBeenCalledTimes(1);
});

describe("EfficientDet-Lite0 output parsing", () => {
    test("uses class indices from the model's 90-label COCO map", () => {
        expect(COCO_LABELS).toHaveLength(90);
        expect(COCO_LABELS.indexOf("car")).toBe(2);
        expect(COCO_LABELS.indexOf("motorcycle")).toBe(3);
        expect(COCO_LABELS.indexOf("bus")).toBe(5);
        expect(COCO_LABELS.indexOf("truck")).toBe(7);
    });

    test("normalizes RGB bytes and zero-pads to the model's input size", () => {
        const { input, padLeft, padTop } = createInputTensor(
            new Uint8Array([255, 127, 0, 255]),
            1,
            1
        );
        const tensor = new Float32Array(input);
        const pixelOffset = (padTop * 320 + padLeft) * 3;

        expect(padLeft).toBe(159);
        expect(padTop).toBe(159);
        expect(tensor[pixelOffset]).toBeCloseTo(1);
        expect(tensor[pixelOffset + 1]).toBeCloseTo((127 - 127.5) / 127.5);
        expect(tensor[pixelOffset + 2]).toBeCloseTo(-1);
        expect(tensor[0]).toBe(0);
    });

    test("uses the COCO vehicle class index and applies the confidence threshold", () => {
        const scores = new Float32Array(19_206 * 90);
        const boxes = new Float32Array(19_206 * 4);
        scores[2] = 0.8;
        scores[3] = 0.49;
        const transform = {
            originalWidth: 320,
            originalHeight: 320,
            resizedWidth: 320,
            resizedHeight: 320,
            padLeft: 0,
            padTop: 0,
        };

        const detections = parseEfficientDetLite0Outputs(
            scores.buffer,
            boxes.buffer,
            transform
        );

        expect(detections).toHaveLength(1);
        expect(detections[0]).toMatchObject({
            label: "car",
        });
        expect(detections[0].confidence).toBeCloseTo(0.8);
        expect(detections[0].boundingBox.left).toBeGreaterThanOrEqual(0);
        expect(detections[0].boundingBox.right).toBeLessThanOrEqual(320);
    });

    test("returns an empty result only for completed output with no vehicle scores", () => {
        const detections = parseEfficientDetLite0Outputs(
            new Float32Array(19_206 * 90).buffer,
            new Float32Array(19_206 * 4).buffer,
            {
                originalWidth: 640,
                originalHeight: 480,
                resizedWidth: 320,
                resizedHeight: 240,
                padLeft: 0,
                padTop: 40,
            }
        );

        expect(detections).toEqual([]);
    });
});

describe("Choose Photo analysis badges", () => {
    test.each([
        ["not_scheduled", null, "Not analyzed"],
        ["pending", null, "Analyzing…"],
        ["processing", null, "Analyzing…"],
        ["completed", 1, "AI: Vehicle detected"],
        ["completed", 0, "AI: No vehicle detected"],
        ["failed", null, "AI: Analysis unavailable"],
    ])("shows %s analysis as %s", (status, vehiclePresent, label) => {
        expect(getAnalysisBadge(status, vehiclePresent).label).toBe(label);
    });

    test("does not interpret incomplete or invalid completed states as negative", () => {
        expect(getAnalysisBadge("failed", 0).label).toBe(
            "AI: Analysis unavailable"
        );
        expect(getAnalysisBadge("completed", null).label).toBe(
            "AI: Analysis unavailable"
        );
    });
});
