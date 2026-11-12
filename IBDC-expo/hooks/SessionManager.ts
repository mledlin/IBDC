/**
 * SessionManager is responsible for determining if incoming data should be appended to an existing session or if
 * a new session in the database should be created.
 */
import { ActiveSessionPersistence } from "./ActiveSession";


/**
 * Active Session lifetime management idea.
 * Use the SessionManager class to determine when a new session was created. SessionMmanager triggers the creation
 * and possible deletion of an active session. This means that SessionManager is responsible for creating and deleting
 * active sessions (lifetime).
 * Should session manager be responsible for tracking and mutating active session?  I think a separate class that
 * encapsulates GPS ping information and getters/setters for the GPS info. What should determine when a GPS ping is
 * added to the active session? Should active session be more than a container for active session data? Should another
 * control class be responsible for adding GPS data into the active session?
 *
 * Should session manager gain an additional responsibility of keeping the internal state of the object it's created as
 * well?
 * This is an important question and I should recall: cohesion, coupling, readability.
 *
 * Adding the responsibility of maintaining the state of an active session to SessionManager makes sense via COHESION
 * because SessionManager already requires information needed for determining the creation and deletion of active sessions.
 * Confidence: Weak
 *
 * Creating a separate module to handle maintaining active session state would create a tight COUPLING between SessionManager
 * and the new class. This wouldn't necessarily be a bad idea because it makes sense for their to be a one-one tight
 * coupling, where the coupling can be defined by a simple interface.
 * Confidence: High
 *
 * Creating a separate module can increase module level readability while adding more interfile complexity. I don't
 * think introducing a new module is a bad thing though because there is a single other file to reference that interacts
 * with SessionManager that also has a well-defined relationship to an active session.
 * Confidence: High
 *
 * Steps to completion:
 *  1. Create a class that encapsulates the Active Session information and mutators. (>>)
 *  2. Create and maintain a reference to the current active session upon creation of a session (>>)
 *  3. Pass information to the ActiveSession through listeners the CommunicationService? Yes()
 *      What outside information does an active session need to operate?
 *      - Information from an incident trigger message
 *
 */


// This interface determines what type of data SessionManager should query in order to determine incoming data's home.
export interface SessionInfo {
    id: string,
    createdTime: string // ISO date string
}

// This interface determines the method name and return type that must exist in order to work with Session
// Manager querying capabilities.
export interface SessionPersistence {
    getAllSessions(): Promise<SessionInfo[]>;
    createSession(id: string, createdTime: string): Promise<void>;
}

export class SessionManager {

    private persistence: SessionPersistence;
    private sessionOperation: Promise<void> = Promise.resolve();
    private activeSession: ActiveSessionPersistence | null = null;


    public constructor(sessionPersistence: SessionPersistence) {
        this.persistence = sessionPersistence;
    }

    // A session covers the two hours beginning at its creation time.
    private isWithinSession(incomingDate: Date, sessionDate: Date): boolean {
        const difference = incomingDate.getTime() - sessionDate.getTime();

        return difference >= 0 &&
            difference <= 2 * 60 * 60 * 1000;
    }

    /**
     *
     * @param incomingDate The Date object of the incoming data. This Date is used to determine which session the incoming
     *                     data belongs to.
     * @returns an existing session ID or undefined if no session exists
     */
    public async determineSession(incomingDate: Date): Promise<string | undefined> {
        const sessions: SessionInfo[] = await this.persistence.getAllSessions();

        const matchingSession = sessions
            .filter((session) => this.isWithinSession(incomingDate, new Date(session.createdTime)))
            .sort((left, right) =>
                new Date(right.createdTime).getTime() - new Date(left.createdTime).getTime()
            )[0];

        return matchingSession?.id;
    }

    public async createSession(startTime: Date): Promise<string> {
        return this.serializeSessionOperation(() => this.persistNewSession(startTime));
    }

    public async getOrCreateSession(startTime: Date): Promise<string> {
        return this.serializeSessionOperation(async () =>
            (await this.determineSession(startTime)) ?? this.persistNewSession(startTime)
        );
    }

    private async persistNewSession(startTime: Date): Promise<string> {
        const sessionId = `session-${startTime.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
        await this.persistence.createSession(sessionId, startTime.toISOString());
        this.activeSession = new ActiveSessionPersistence(sessionId);
        return sessionId;
    }

    private async serializeSessionOperation<T>(operation: () => Promise<T>): Promise<T> {
        const previousOperation = this.sessionOperation;
        let releaseOperation: () => void = () => undefined;
        this.sessionOperation = new Promise<void>((resolve) => {
            releaseOperation = resolve;
        });

        await previousOperation;
        try {
            return await operation();
        } finally {
            releaseOperation();
        }
    }

    public getActiveSessionPersistence(): ActiveSessionPersistence | null {
          return this.activeSession;
    }
}