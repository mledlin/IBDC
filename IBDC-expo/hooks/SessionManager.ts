/**
 * SessionManager is responsible for determining if incoming data should be appended to an existing session or if
 * a new session in the database should be created.
 */


// This interface determines what type of data SessionManager should query in order to determine incoming data's home.
export interface SessionInfo {
    id: string,
    createdTime: string // A string of format -> Date.toString()
}

// This interface determines the method name and return type that must exist in order to work with Session
// Manager querying capabilities.
export interface SessionPersistence {
    getAllSessions(): Promise<SessionInfo[]>;
}

//

export class SessionManager {

    private persistence: SessionPersistence;


    public constructor(sessionPersistence: SessionPersistence) {
        this.persistence = sessionPersistence;
    }

    // Determines which date M/D/Y an event occurred.
    private isSameDate(incomingDate: Date, sessionDate: Date): boolean {
        return (
            incomingDate.getFullYear() === sessionDate.getFullYear() &&
            incomingDate.getMonth() === sessionDate.getMonth() &&
            incomingDate.getDate() === sessionDate.getDate()
        );
    }

    // Determines if the incoming data happened within 2 hours from the start of an existing session.
    private isWithin2HoursAfterSessionInit(incomingDate: Date, sessionDate: Date): boolean {
        const difference = incomingDate.getTime() - sessionDate.getTime();

        // The math here is converting milliseconds to hours
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

        for (const session of sessions) {
            const sessionDate = new Date(session.createdTime);
            if (this.isSameDate(incomingDate, sessionDate)) {
                if (this.isWithin2HoursAfterSessionInit(incomingDate, sessionDate)) {
                    return session.id;
                }
            }
        }
        return undefined;
    }
}