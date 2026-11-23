import { ActiveSessionPersistence } from "@/hooks/ActiveSession";
import { nearestCoordinates } from "@/services/GPSOffset";

const fix = (timestamp: number, latitude = 32) => ({
    timestamp, coords: { latitude, longitude: -110 },
});

beforeEach(() => jest.useFakeTimers({ now: 10000 }));
afterEach(() => jest.useRealTimers());

test("returns the last GPS fix strictly before the incident", () => {
    const samples = [fix(1000, 1), fix(2000, 2), fix(9000, 9)];

    expect(nearestCoordinates([], 1500)).toBeNull();
    expect(nearestCoordinates(samples, 500)).toBeNull();
    expect(nearestCoordinates(samples, 1000)).toBeNull();

    // The 2000 fix is closer, but it occurred after the incident
    expect(nearestCoordinates(samples, 1600)).toEqual(samples[0].coords);

    // An exact timestamp match is excluded
    expect(nearestCoordinates(samples, 9000)).toEqual(samples[1].coords);

    // The latest earlier fix is used even across a sampling gap.
    expect(nearestCoordinates(samples, 5000)).toEqual(samples[1].coords);
    expect(nearestCoordinates(samples, 10000)).toEqual(samples[2].coords);
});

test("samples each second, looks up delays and request each live fix separately", async () => {
    const read = jest.fn(async () => fix(Date.now(), Date.now() / 1000));
    const ride = new ActiveSessionPersistence(Date.now(), { requestPermission: async () => true, read });
    await jest.advanceTimersByTimeAsync(3000);
    expect(read).toHaveBeenCalledTimes(4);
    expect(await ride.incidentLocation(Date.now(), 1800)).toEqual(fix(0, 11).coords);
    expect(await ride.incidentLocation(Date.now(), 3001)).toBeNull();
    await Promise.all([ride.incidentLocation(Date.now(), 0), ride.incidentLocation(Date.now(), 0)]);
    expect(read).toHaveBeenCalledTimes(6);
    ride.stop();
    await jest.advanceTimersByTimeAsync(2500);
    expect(read).toHaveBeenCalledTimes(6);
    expect(await ride.incidentLocation(13000, 1000)).toBeNull();
});

test("denial or a stale dedicated fix yields unknown coordinates", async () => {
    const read = jest.fn(async () => fix(10000));
    const denied = new ActiveSessionPersistence(10000, { requestPermission: async () => false, read });
    expect(await denied.incidentLocation(10000, 0)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    const granted = new ActiveSessionPersistence(10000, { requestPermission: async () => true, read });
    expect(await granted.incidentLocation(11000, 0)).toBeNull();
    granted.stop();
});

test("slow GPS does not build a queue or block the incident indefinitely", async () => {
    const read = jest.fn(() => new Promise<ReturnType<typeof fix>>(() => {}));
    const ride = new ActiveSessionPersistence(Date.now(), { requestPermission: async () => true, read });
    const incident = ride.incidentLocation(Date.now(), 0);
    await jest.advanceTimersByTimeAsync(12000);
    expect(await incident).toBeNull();
    expect(read).toHaveBeenCalledTimes(2);
    ride.stop();
});

test("disconnect during the permission prompt cannot restart a stopped ride", async () => {
    let grant!: (value: boolean) => void;
    const read = jest.fn(async () => fix(Date.now()));
    const ride = new ActiveSessionPersistence(Date.now(), {
        requestPermission: () => new Promise(resolve => { grant = resolve; }), read,
    });
    ride.stop();
    grant(true);
    await jest.advanceTimersByTimeAsync(2000);
    expect(read).not.toHaveBeenCalled();
});
