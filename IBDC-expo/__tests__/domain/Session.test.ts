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
        }
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







