//base64 encode and decode itself is handeled by the base64-js package (toByteArray/ fromByteArray)
// see SimulatedIBDC.ts and ImageIngestService.ts/ This file just holds the one helper base64-js doesn't provide
// It joins ordered byte cunckeds into one buffer before encoding/ after decoding.

export function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}
