import TextRecognition from "@react-native-ml-kit/text-recognition";
import { GoogleMLKitTextRecognitionService } from "@/services/TextRecognitionService";

jest.mock("@react-native-ml-kit/text-recognition", () => ({
    __esModule: true,
    default: {
        recognize: jest.fn(),
    },
}));

const recognizeMock = jest.mocked(TextRecognition.recognize);

describe("GoogleMLKitTextRecognitionService", () => {
    const service = new GoogleMLKitTextRecognitionService();

    beforeEach(() => {
        recognizeMock.mockReset();
    });

    it("reports when non-whitespace text is recognized", async () => {
        recognizeMock.mockResolvedValue({
            text: "  Main Street ",
            blocks: [],
        });

        await expect(service.hasText("file:///incident.jpg")).resolves.toBe(
            true
        );
        expect(recognizeMock).toHaveBeenCalledWith("file:///incident.jpg");
    });

    it("does not report text when recognition returns only whitespace", async () => {
        recognizeMock.mockResolvedValue({
            text: " \n ",
            blocks: [],
        });

        await expect(service.hasText("file:///incident.jpg")).resolves.toBe(
            false
        );
    });

    it("propagates recognition errors to the caller", async () => {
        const error = new Error("Recognition failed");
        recognizeMock.mockRejectedValue(error);

        await expect(service.hasText("file:///incident.jpg")).rejects.toBe(
            error
        );
    });
});
