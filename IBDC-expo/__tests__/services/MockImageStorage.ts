import { ImageStorage } from "@/services/ExpoImageStorage";


export function createMockImageStorage(): jest.Mocked<ImageStorage> {
    return {
        saveImage: jest.fn((fileName: string, data: Uint8Array): string => {
            const fileUri = `mock-directory/${fileName}`
            return fileUri
        })
    };
}

