import { DeviceInfo } from "../context/DeviceContext"
import { getAllSessions } from "@/database/SessionDao"
import { Session } from "../domain/Session"
import { DatabaseSessionRow} from "@/database/SessionDao";

/**
 * This module encapsulates all functionality related to sessions. This Class utilizes the Singleton Design Pattern.
 *  - Links incoming incident data to a session within the database.
 */

export class SessionManager {
    // Reference to the only SessionManager object.
    private static instance: SessionManager;

    // All sessions from database. The unknown type has the shape of the database table Session.
    /**
     * id: TEXT (the unique index is a number though)
     * created_time: TEXT
     * last_gps_long: REAL
     * last_gps_lat: REAL
     * last_gps_time: TEXT
     * @private
     */
    private allSessionsInDb: DatabaseSessionRow[] = []; // Should this expect a Session type or should this return exactly the database
    // representation? This question arises from the fact that a Session type and the Session table in the db are represented
    // have different data shapes and types. To demonstrate, compare the Session type to the database types above.

    private constructor() {
        this.syncSessions();
    }

    // Pulls the latest data from the database into the Class
    private async syncSessions() {
        this.allSessionsInDb = await getAllSessions();
    }

    // This function permits programmers to either get a reference to the only SessionManager object or create the only
    // SessionManager.
    public static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    // Determines whether something occurred on the same Day, Month, Year
    private isSameDate(incomingDate: Date, sessionDate: Date): boolean {
        return incomingDate.toString() === sessionDate.toString()
    }

    // Determines if the incoming data happened within 2 hours from the start of a session.
    private isWithin2HoursAfterSessionInit(incomingDate: Date, sessionDate:Date): boolean {
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
    public async determineSession(incomingDate: Date): Promise<Promise<number> | Promise<undefined>> {
        await this.syncSessions();
        for (const session of this.allSessionsInDb) {
            if (this.isSameDate(incomingDate, new Date(session.created_time))) {
                if (this.isWithin2HoursAfterSessionInit(incomingDate, new Date(session.created_time))) {
                    return +session.id;
                }
            }
        }
        // No existing session for this data. Return a new index that doesn't exist in the Database table for Session.
        return undefined;
    }









}

