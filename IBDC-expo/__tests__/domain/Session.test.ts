import {SessionManager, SessionPersistence, SessionInfo} from "@/hooks/SessionManager"

test("determineSession() boundary analysis", async () => {
    const sessionStart = new Date(2026, 1, 1, 1, 0, 0);
    const sessionId = "boundary-test-session";
    const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;

    const persistence: SessionPersistence = {
        async getAllSessions(): Promise<SessionInfo[]> {
            return [{
                id: sessionId,
                createdTime: sessionStart.toISOString(),
            }];
        },
    };

    const testManager = new SessionManager(persistence);

    // 1 millisecond before the session starts is excluded.
    const beforeStart = new Date(sessionStart.getTime() - 1);
    expect(
        await testManager.determineSession(beforeStart),
    ).toBeUndefined();

    // Exact session start is included.
    expect(
        await testManager.determineSession(sessionStart),
    ).toBe(sessionId);

    // Exactly 2 hours after the session starts is included.
    const exactlyTwoHoursLater = new Date(
        sessionStart.getTime() + TWO_HOURS_IN_MS,
    );
    expect(
        await testManager.determineSession(exactlyTwoHoursLater),
    ).toBe(sessionId);

    // 1 milli beyond the 2 hr window is excluded.
    const afterWindow = new Date(
        sessionStart.getTime() + TWO_HOURS_IN_MS + 1,
    );
    expect(
        await testManager.determineSession(afterWindow),
    ).toBeUndefined();
});

test("determineSession() includes events across midnight", async () => {
    // February 1 at 11 PM through February 2 at 1 AM.
    // JavaScript month 1 means February.
    const sessionStart = new Date(2026, 1, 1, 23, 0, 0);
    const midnight = new Date(2026, 1, 2, 0, 0, 0);
    const windowEnd = new Date(2026, 1, 2, 1, 0, 0);
    const sessionId = "midnight-test-session";

    const persistence: SessionPersistence = {
        async getAllSessions(): Promise<SessionInfo[]> {
            return [{
                id: sessionId,
                createdTime: sessionStart.toISOString(),
            }];
        },
    };

    const testManager = new SessionManager(persistence);

    expect(
        await testManager.determineSession(midnight),
    ).toBe(sessionId);

    expect(
        await testManager.determineSession(windowEnd),
    ).toBe(sessionId);

    const afterWindow = new Date(windowEnd.getTime() + 1);

    expect(
        await testManager.determineSession(afterWindow),
    ).toBeUndefined();
});







