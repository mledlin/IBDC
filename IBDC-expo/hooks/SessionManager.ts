/**
 * SessionManager is responsible for determining if incoming data should be appended to an existing session or if
 * a new session in the database should be created.
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

//

export class SessionManager {

    private persistence: SessionPersistence;
    private sessionOperation: Promise<void> = Promise.resolve();


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
}