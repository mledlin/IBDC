import { nearestCoordinates, SAMPLE_INTERVAL_MS } from "@/services/GPSOffset";
import type { Coordinates, GPSFix } from "@/services/GPSOffset";

export interface LocationSource {
    requestPermission(): Promise<boolean>;
    read(): Promise<GPSFix>;
}

/** One instance owns the fixes and timer for one connected ride. */
export class ActiveSessionPersistence {
    private readonly samples: GPSFix[] = [];
    private timer?: ReturnType<typeof setInterval>;
    private stopped = false;
    private sampling = false;
    private readonly permission: Promise<boolean>;
    readonly startedAt: number;
    private readonly source: LocationSource;

    constructor(startedAt: number, source: LocationSource) {
        this.startedAt = startedAt;
        this.source = source;
        this.permission = source.requestPermission().catch(() => false);
        void this.permission.then(granted => {
            if (!granted || this.stopped) return;
            void this.sample();
            this.timer = setInterval(() => void this.sample(), SAMPLE_INTERVAL_MS);
        });
    }

    private async read(): Promise<GPSFix | null> {
        try {
            const { timestamp, coords: { latitude, longitude } } = await this.source.read();
            if (this.stopped || !Number.isFinite(timestamp) || timestamp < this.startedAt ||
                !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            return { timestamp, coords: { latitude, longitude } };
        } catch {
            return null;
        }
    }

    private async sample(): Promise<void> {
        if (this.sampling) return;
        this.sampling = true;
        try {
            const fix = await this.read();
            const last = this.samples[this.samples.length - 1];
            if (fix && (!last || fix.timestamp > last.timestamp)) this.samples.push(fix);
        } finally {
            this.sampling = false;
        }
    }

    async incidentLocation(receivedAt: number, offsetMs: number): Promise<Coordinates | null> {
        const target = receivedAt - offsetMs;
        if (this.stopped || target < this.startedAt) return null;
        if (offsetMs > 0) return nearestCoordinates(this.samples, target);

        // Bound the wait for permission and a dedicated fix so transfer ack can proceed.
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let expired = false;
        try {
            const deadline = new Promise<null>(resolve => {
                timeout = setTimeout(() => { expired = true; resolve(null); }, 10000);
            });
            const freshFix = this.permission.then(async granted => {
                if (!granted || this.stopped || expired) return null;
                const fix = await this.read();
                return fix && fix.timestamp >= receivedAt ? fix.coords : null;
            });
            return await Promise.race([freshFix, deadline]);
        } finally {
            clearTimeout(timeout);
        }
    }

    stop(): void {
        this.stopped = true;
        clearInterval(this.timer);
        this.samples.length = 0;
    }
}
