/**
 * ALMOST ALL DATA IN THIS CLASS WAS CREATED WITH GENERATIVE AI (ChatGPT)
 *
 * Permission was obtained directly from our sponsor on 26 March 2026 around 2 PM via email.
 *
 * The format of exporting functions with mock data was created without generative AI but
 * was then replicated many times over using AI. The purpose of this is to provide mock data
 * to all screens for demonstration purposes and help to ensure standardization of data handling.
 *
 * This data is not intended to "ship" in a final product.
 *
 * If any data is copied/pasted from this file I advise labeling it with a generative AI notice.
 *
 * *Some rider notes and fake data was created manually before gen AI was used.
 */


// Mock incident and session data for use in project.

/**
 * Currently available:
 *
 * createSingleMockSession()
 * createSingleMockIncident()
 *
 * createFullMockHistory() - 18 sessions with incidents in all stages
 * mockEmptyRideSessions() - 18 sessions with no incidents
 *
 * There are no image files yet. I was planning to add them later as we will need them.
 */


// Add more as you feel they are needed.

import {Incident} from "@/domain/Incident";
import {Session} from "@/domain/Session";

function createSingleMockSession(): Session {
    const session: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-24T08:15:00"),
        startDateStamp: new Date("2026-03-24T08:00:00"),
    };

    const incidents: Incident[] = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-24T08:45:12"),
            licensePlate: "222222",
            riderNotes: "Road rage. This guy almost hit me last week too!",
            session: session,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-24T17:00:00"),
            licensePlate: "ABCDEF",
            riderNotes: "Stopped in bike lane.",
            session: session,
        },
    ];

    session.incidents = incidents;
    return session;
}

function createSingleMockIncident(): Incident {
    const incident: Incident = {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.111,
                longitude: -111.111,
            },
            gpsTimestamp: new Date("2026-03-24T08:45:12"),
            licensePlate: "222222",
            riderNotes: "Road rage. This guy almost hit me last week too!",
            session: null,
        };

    return incident;
}

export function mockEmptyRideSessions(): Session[] {
    const sessions: Session[] = [];

    const session1: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-24T08:35:00"),
        startDateStamp: new Date("2026-03-24T07:50:00"),
    };
    sessions.push(session1);

    const session2: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-23T18:55:00"),
        startDateStamp: new Date("2026-03-23T18:10:00"),
    };
    sessions.push(session2);

    const session3: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-22T10:05:00"),
        startDateStamp: new Date("2026-03-22T09:15:00"),
    };
    sessions.push(session3);

    const session4: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-21T07:20:00"),
        startDateStamp: new Date("2026-03-21T06:45:00"),
    };
    sessions.push(session4);

    const session5: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-20T18:10:00"),
        startDateStamp: new Date("2026-03-20T17:30:00"),
    };
    sessions.push(session5);

    const session6: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-18T08:50:00"),
        startDateStamp: new Date("2026-03-18T08:00:00"),
    };
    sessions.push(session6);

    const session7: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-17T13:00:00"),
        startDateStamp: new Date("2026-03-17T12:20:00"),
    };
    sessions.push(session7);

    const session8: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-16T07:45:00"),
        startDateStamp: new Date("2026-03-16T07:10:00"),
    };
    sessions.push(session8);

    const session9: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-15T19:40:00"),
        startDateStamp: new Date("2026-03-15T19:00:00"),
    };
    sessions.push(session9);

    const session10: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-14T11:25:00"),
        startDateStamp: new Date("2026-03-14T10:30:00"),
    };
    sessions.push(session10);

    const session11: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-12T09:10:00"),
        startDateStamp: new Date("2026-03-12T08:40:00"),
    };
    sessions.push(session11);

    const session12: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-11T18:35:00"),
        startDateStamp: new Date("2026-03-11T17:50:00"),
    };
    sessions.push(session12);

    const session13: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-10T07:30:00"),
        startDateStamp: new Date("2026-03-10T06:55:00"),
    };
    sessions.push(session13);

    const session14: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-09T13:50:00"),
        startDateStamp: new Date("2026-03-09T13:15:00"),
    };
    sessions.push(session14);

    const session15: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-08T10:20:00"),
        startDateStamp: new Date("2026-03-08T09:45:00"),
    };
    sessions.push(session15);

    const session16: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-07T19:05:00"),
        startDateStamp: new Date("2026-03-07T18:25:00"),
    };
    sessions.push(session16);

    const session17: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-06T08:00:00"),
        startDateStamp: new Date("2026-03-06T07:35:00"),
    };
    sessions.push(session17);

    const session18: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-05T17:30:00"),
        startDateStamp: new Date("2026-03-05T16:40:00"),
    };
    sessions.push(session18);

    return sessions;
}

export function createFullMockHistory(): Session[] {
    const sessions: Session[] = [];

    const session1: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-24T08:15:00"),
        startDateStamp: new Date("2026-03-24T08:00:00"),
    };
    session1.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-24T08:45:12"),
            licensePlate: "222222",
            riderNotes: "Road rage. This guy almost hit me last week too!",
            session: session1,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-24T17:00:00"),
            licensePlate: "",
            riderNotes: "Stopped in bike lane.",
            session: session1,
        },
    ];
    sessions.push(session1);

    const session2: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-23T18:55:00"),
        startDateStamp: new Date("2026-03-23T18:10:00"),
    };
    session2.incidents = [];
    sessions.push(session2);

    const session3: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-22T10:05:00"),
        startDateStamp: new Date("2026-03-22T09:15:00"),
    };
    session3.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-22T09:42:00"),
            licensePlate: "XYZ123",
            riderNotes: "",
            session: session3,
        },
    ];
    sessions.push(session3);

    const session4: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-21T07:20:00"),
        startDateStamp: new Date("2026-03-21T06:45:00"),
    };
    session4.incidents = [];
    sessions.push(session4);

    const session5: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-20T18:10:00"),
        startDateStamp: new Date("2026-03-20T17:30:00"),
    };
    session5.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-20T17:50:00"),
            licensePlate: "",
            riderNotes: "Car was parked across the bike lane.",
            session: session5,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-20T18:02:00"),
            licensePlate: "JKL789",
            riderNotes: "",
            session: session5,
        },
    ];
    sessions.push(session5);

    const session6: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-18T08:50:00"),
        startDateStamp: new Date("2026-03-18T08:00:00"),
    };
    session6.incidents = [];
    sessions.push(session6);

    const session7: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-17T13:00:00"),
        startDateStamp: new Date("2026-03-17T12:20:00"),
    };
    session7.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-17T12:40:00"),
            licensePlate: "BIKE01",
            riderNotes: "Driver honked aggressively while passing.",
            session: session7,
        },
    ];
    sessions.push(session7);

    const session8: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-16T07:45:00"),
        startDateStamp: new Date("2026-03-16T07:10:00"),
    };
    session8.incidents = [];
    sessions.push(session8);

    const session9: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-15T19:40:00"),
        startDateStamp: new Date("2026-03-15T19:00:00"),
    };
    session9.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-15T19:15:00"),
            licensePlate: "",
            riderNotes: "",
            session: session9,
        },
    ];
    sessions.push(session9);

    const session10: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-14T11:25:00"),
        startDateStamp: new Date("2026-03-14T10:30:00"),
    };
    session10.incidents = [];
    sessions.push(session10);

    const session11: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-12T09:10:00"),
        startDateStamp: new Date("2026-03-12T08:40:00"),
    };
    session11.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-12T08:50:00"),
            licensePlate: "SAFE55",
            riderNotes: "Truck blocked the lane during delivery.",
            session: session11,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-12T09:05:00"),
            licensePlate: "",
            riderNotes: "Driver turned right in front of me.",
            session: session11,
        },
    ];
    sessions.push(session11);

    const session12: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-11T18:35:00"),
        startDateStamp: new Date("2026-03-11T17:50:00"),
    };
    session12.incidents = [];
    sessions.push(session12);

    const session13: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-10T07:30:00"),
        startDateStamp: new Date("2026-03-10T06:55:00"),
    };
    session13.incidents = [];
    sessions.push(session13);

    const session14: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-09T13:50:00"),
        startDateStamp: new Date("2026-03-09T13:15:00"),
    };
    session14.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-09T13:30:00"),
            licensePlate: "NOP333",
            riderNotes: "",
            session: session14,
        },
    ];
    sessions.push(session14);

    const session15: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-08T10:20:00"),
        startDateStamp: new Date("2026-03-08T09:45:00"),
    };
    session15.incidents = [];
    sessions.push(session15);

    const session16: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-07T19:05:00"),
        startDateStamp: new Date("2026-03-07T18:25:00"),
    };
    session16.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-07T18:40:00"),
            licensePlate: "",
            riderNotes: "Stopped across crosswalk and bike access area.",
            session: session16,
        },
    ];
    sessions.push(session16);

    const session17: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-06T08:00:00"),
        startDateStamp: new Date("2026-03-06T07:35:00"),
    };
    session17.incidents = [];
    sessions.push(session17);

    const session18: Session = {
        incidents: [],
        lastGPSCoordinate: {
            latitude: 111.111,
            longitude: -111.111,
        },
        lastGPSTime: new Date("2026-03-05T17:30:00"),
        startDateStamp: new Date("2026-03-05T16:40:00"),
    };
    session18.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-05T17:05:00"),
            licensePlate: "END999",
            riderNotes: "",
            session: session18,
        },
    ];
    sessions.push(session18);

    return sessions;
}

// Returns 1 session
export const defaultSession = createSingleMockSession();

// Returns 1 incident
export const defaultIncident = createSingleMockIncident();

// Returns arrays of sessions
export const fullMockHistory = createFullMockHistory();
export const emptyMockSessions = mockEmptyRideSessions();