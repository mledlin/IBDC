import { LocationObject, getCurrentPositionAsync } from 'expo-location';
import type { EventNotification, IBDCCommunicationService } from "@/services/IBDCCommunicationService";

// Use the session manager to get the current session at start up of the program?
// When does a session start? When the user connects to the application? I guess so, first couple GPS pings will probably
// be not useful. There can be many false incidents at the beginning of the ride?

export type ActiveSessionListener = {
    listener: (message: EventNotification) => void;
}

export class ActiveSessionPersistence {

    private readonly sessionId: string = ''
    private GPSPings: LocationObject[] = [];
    private DEFAULT_GPS_PING_RATE_SECONDS: number = 5;
    private pingsActive: boolean = false;
    private commsService: IBDCCommunicationService;

    constructor(session_id: string, commsService: IBDCCommunicationService,  GPS_ping_rate_seconds?: number) {
        this.sessionId = session_id;
        this.commsService = commsService;
        if (GPS_ping_rate_seconds !== undefined) {
            if (GPS_ping_rate_seconds > 0) {
                this.DEFAULT_GPS_PING_RATE_SECONDS = GPS_ping_rate_seconds;
            }
        }
        this.pingsActive = true;
    }

    /**
     * This will start taking GPS readings periodically throughout the ride.
     * @param GPS_ping_rate
     */
    public async startPing(GPS_ping_rate = this.DEFAULT_GPS_PING_RATE_SECONDS): Promise<void> {
        while(this.pingsActive) {
            this.GPSPings.push(await getCurrentPositionAsync())
        }
    }

    /**
     *
     */
    public stopPing(): void {
        this.pingsActive = false;
    }

    /**
     * Returns a copy of the GPSPings array at the time of the function call
     */
    public getGPSPings(): LocationObject[] {
        return [...this.GPSPings];
    }

    /**
     *
     */
    public getSessionId(): string {
        return this.sessionId;
    }

















}