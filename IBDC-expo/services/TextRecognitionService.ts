import TextRecognition from "@react-native-ml-kit/text-recognition";

export interface TextRecognitionService {
    hasText(imageUri: string): Promise<boolean>;
}

export class GoogleMLKitTextRecognitionService implements TextRecognitionService {
    public async hasText(imageUri: string): Promise<boolean> {
        const result = await TextRecognition.recognize(imageUri);
        return result.text.trim().length > 0;
    }
}
