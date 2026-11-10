import { LocationObject, getCurrentPositionAsync } from 'expo-location';
import { SessionManager } from "./SessionManager";


// Use the session manager to get the current session at start up of the program?
// When does a session start? When the user connects to the application? I guess so, first couple GPS pings will probably
// be not useful. There can be many false incidents at the beginning of the ride?

class ActiveSessionPersistence {

    private GPSPings: LocationObject[] = [];
    private sessionId: string = '';


    //
    /**
     * Starts the GPS pings periodically for the current session.
     * @param ping_rate
     */
    public startGPSPings(ping_rate: number){

    }

    /**
     * Terminate taking the GPS locations
     */
    public stopGPSPings(): void {

    }

    /**
     * Gets the snapshot of pings for this ride
     * @returns the list of location pings for this session
     */
    public getGPSPings(): LocationObject[] | null {
        return this.GPSPings;
    }
    //












}