export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface GPSFix {
    timestamp: number;
    coords: Coordinates;
}

export const SAMPLE_INTERVAL_MS = 1000;

// Samples are stored in timestamp order.
// Returns GPS position just before incident (within 1 sec)
export function nearestCoordinates(samples: readonly GPSFix[], target: number): Coordinates | null {
    let low = 0;
    let high = samples.length;

    while (low < high) {
        const middle = Math.floor((low + high) / 2);

        if (samples[middle].timestamp < target) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return samples[low - 1]?.coords ?? null;
}
