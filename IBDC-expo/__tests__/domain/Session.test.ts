import {SessionManager, SessionPersistence, SessionInfo} from "@/hooks/SessionManager"
import {generateMockSessionData, MockDataPersistence} from "@/services/MockDataService";
import {InMemoryMockDataStore, makeInMemoryMockDataPersistence} from "@/__tests__/factories/MockDataTestFactory";

let sessionPersistence: SessionPersistence;
let _store: InMemoryMockDataStore;
let manager: SessionManager;

beforeAll(async () => {
    const { persistence, store } = makeInMemoryMockDataPersistence();
    await generateMockSessionData(persistence, {incidentCount: 4});

    _store = store;
    sessionPersistence = {
        async getAllSessions(): Promise<SessionInfo[]> {
            return store.sessions;
        },
        async createSession(id: string, createdTime: string): Promise<void> {
            store.sessions.push({id, createdTime});
        },
    };
    manager = new SessionManager(sessionPersistence);
})

test("determineSession() boundary analysis", async () => {
    // Base session time to compare on each test
    let dateForSessionZero: Date = new Date(_store.sessions[0].createdTime);

    const TWO_HOURS_IN_MS: number = 7200000

    // One second before an incident occurs
    let oneSecBefore: Date = new Date(dateForSessionZero.getTime() - 1000);
    expect(await manager.determineSession(oneSecBefore)).toBe(undefined);


    // One second after the end of the 2-hour window
    let oneSecAfter: Date = new Date(dateForSessionZero.getTime() + TWO_HOURS_IN_MS + 1000);
    expect(await manager.determineSession(oneSecAfter)).toBe(undefined);

    // The last second before a new two hour period begins
    let lastSecOfEvent: Date = new Date(dateForSessionZero.getTime() + TWO_HOURS_IN_MS);
    expect(await manager.determineSession(lastSecOfEvent)).toBe(_store.sessions[0].id);

})

test("sessions match events across midnight and through the two-hour boundary", async () => {
    const sessions: SessionInfo[] = [];
    const testManager = new SessionManager({
        async getAllSessions() {
            return sessions;
        },
        async createSession(id, createdTime) {
            sessions.push({id, createdTime});
        },
    });
    const startTime = new Date("2026-10-15T23:30:00.000Z");
    const sessionId = await testManager.createSession(startTime);

    expect(await testManager.determineSession(new Date("2026-10-16T01:30:00.000Z"))).toBe(sessionId);
    expect(await testManager.determineSession(new Date("2026-10-16T01:30:00.001Z"))).toBeUndefined();
});

test("getOrCreateSession creates a session at event time when none matches", async () => {
    const sessions: SessionInfo[] = [];
    const testManager = new SessionManager({
        async getAllSessions() {
            return sessions;
        },
        async createSession(id, createdTime) {
            sessions.push({id, createdTime});
        },
    });
    const eventTime = new Date("2099-01-01T12:00:00.000Z");

    const sessionId = await testManager.getOrCreateSession(eventTime);

    expect(sessions.find((session) => session.id === sessionId)?.createdTime).toBe(eventTime.toISOString());
    expect(await testManager.getOrCreateSession(new Date(eventTime.getTime() + 60_000))).toBe(sessionId);
});

test("concurrent events in the same window use one newly created session", async () => {
    const sessions: SessionInfo[] = [];
    const testManager = new SessionManager({
        async getAllSessions() {
            return sessions;
        },
        async createSession(id, createdTime) {
            sessions.push({id, createdTime});
        },
    });
    const eventTime = new Date("2099-02-01T12:00:00.000Z");

    const sessionIds = await Promise.all([
        testManager.getOrCreateSession(eventTime),
        testManager.getOrCreateSession(new Date(eventTime.getTime() + 60_000)),
    ]);

    expect(sessionIds[0]).toBe(sessionIds[1]);
    expect(sessions).toHaveLength(1);
});


