import { DeviceInfo } from "../context/DeviceContext"
import { getAllSessions } from "../database/SessionDao"
import { Session } from "../domain/Session"

/**
 * This module encapsulates all functionality related to sessions. This Class utilizes the Singleton Design Pattern.
 *  - Links incoming incident data to a session within the database.
 */

export class SessionManager {
    // Reference to the only SessionManager object.
    private static instance: SessionManager;

    // All sessions from database
    private allSessionsInDb: Promise<unknown[]> | undefined

    private constructor() {
        this.syncSessions();
    }

    // Pulls the latest data from the database into the Class
    private syncSessions() {
        this.allSessionsInDb = getAllSessions();
    }

    // This function permits programmers to either get a reference to the only SessionManager object or create the only
    // SessionManager.
    public static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    // Determines whether something occurred on the same Day, Month, Year (does not compare hour time)
    private isSameDate(d1: Date, d2: Date): boolean {
        return d1.toString() === d2.toString()
    }

    // Determines if the incoming data happened within 2 hours from the start of a session.
    private isWithin2HoursAfterSessionInit(incomingDate: Date, sessionDate:Date): boolean {
        const difference = incomingDate.getTime() - sessionDate.getTime();

        // The math here is converting milliseconds to hours
        return difference >= 0 &&
            difference <= 2 * 60 * 60 * 1000;
    }

    private determineSession(incomingDate: Date): int {

    }






}

