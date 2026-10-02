import { LoadImageData } from "@/ble/SimulatedIBDCImageLoader";

const imageBytes: Uint8Array[] = [
    new Uint8Array(10).fill(1),
    new Uint8Array(10).fill(0),
    new Uint8Array(10).fill(2),
]


export function createMockImageLoader(): LoadImageData {
    return {
        loadImagesAsBytes: jest.fn(() => {
            return Promise.resolve(imageBytes)
        })
    }
}



