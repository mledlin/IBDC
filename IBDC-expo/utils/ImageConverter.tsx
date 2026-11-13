import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Converts images to JPEG for standardized uploading.
 */
export async function convertImage(
    imageUri: string
): Promise<string> {
    const context = ImageManipulator.manipulate(imageUri);
    const rendered = await context.renderAsync();

    const result = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.95,
    });

    return result.uri;
}