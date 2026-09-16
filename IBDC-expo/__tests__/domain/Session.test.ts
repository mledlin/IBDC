import { Session } from "../../domain/Session"
import { SessionManager } from "@/hooks/SessionManager"
/**
 * Testing of the session class should be based on the functionality that sessions provide.
 * Sessions are responsible for:
 *  - Grouping incident data together based on time.
 *  The way we defined our sessions, each session starts when a user connects to the IBDC device (assumption?)
 *  and lasts for 2 hours. This means that all incidents that occur within this 2-hour period are grouped together under
 *  the same session. From this statement of functionality, the following tests can be written:
 *      - Ensure a new session is created and stored in the database upon IBDC connection to the app. * Only create a new
 *      session when there is no current active session.
 *      - Ensure incidents get appended to current session when there is an active session.
 *      - Ensure current session is written to the database upon closure of the app.
 *      Which part of the program is responsible for managing sessions?
 *      Does it make sense to test the session type or should I be testing the functionality of a class responsible for
 *      managing sessions?
 *      Does session management need a class, or is this something that can be taken care of in a small module in _layout.tsx?
 *
 * Ideal Keep It Super Simple model for session management:
 * (Trigger) Connect to IBDC sensor -> (Response) Check last created session time -> (Logic) Determine to create new
 *  session or write to an existing session -> (Trigger) User exits the app -> (Logic) Write session data -> REPEAT
 *
 * I don't think sessions need a manager since the only functionality a session offers is grouping data together based
 * on time. I think the ideal solution would be to write a custom hook that determines whether to write to an existing
 * session or create a new one upon connecting to the IBDC and use this hook in _layout.tsx. The hook can then make
 * available the ID key of the session that all writes should go to. Thoughts or additions?
 *
 */



/**
 * @Test This method tests to ensure that determineSession() accurately identifies if an existing session exists for
 * new data or if a new session should be created.
 *
 * Cases:                                       Expected State
 * 1. Query an empty database                   Return -1
 *
 * 2. Query a database with n or more elements
 *    and there is no matching session          Return -1
 *
 * 3. Query database with n or more elements
 * and matching session exists                  Return ID of existing session
 *
 *
 * @param time_of_event time when event was received
 * @param date_of_event date when event was recevied
 */


test("getInstance()", async () => {
    let manager: SessionManager = SessionManager.getInstance();
    expect(manager).toBeDefined();
    expect(SessionManager.getInstance()).toEqual(manager);
})



test("determineSession()", () => {
    // Create test database
    console.log("determineSessionTest -  Case 1. Query an empty database")

    // Read in all sessions from the database. Should be zero in this case.
    let sessions: Session[] = [];
    expect(sessions.length).toBe(0);

    let currentDate = new Date();

    let found: boolean = false;
    for (let session of sessions) {
        // These events happened on the same day, month, and year
        if (session.startDateStamp?.toDateString() === currentDate.toDateString()) {

        }
    }
    expect(found).toBe(false)
})



