import { LoadImageData } from "@/ble/SimulatedIBDCImageLoader";

const imageBytes: Uint8Array[] = [
    new Uint8Array(800).fill(1),
    new Uint8Array(800).fill(2),
    new Uint8Array(800).fill(3),
]


export function createMockImageLoader(imagebytes: Uint8Array[] = imageBytes): LoadImageData {
    return {
        loadImagesAsBytes: jest.fn(() => {
            return Promise.resolve(imageBytes)
        })
    }
}



