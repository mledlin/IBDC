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
//File is being sidelined to use DB 
/*
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
            imageFiles: [
                {
                    id: "s1i2img1",
                    fileName: "example.jpg",
                    uri: require("@/assets/images/example.jpg"),
                },
            ],
            selectedImageId: "s1i2img1",
            gpsLocation: {
                latitude: 111.112,
                longitude: -111.112,
            },
            gpsTimestamp: new Date("2026-03-24T09:10:00"),
            licensePlate: "ABC123",
            riderNotes: "Driver cut into the bike lane.",
            session: session1,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.113,
                longitude: -111.113,
            },
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
    session2.incidents = [
        {
            imageFiles: [
                {
                    id: "s2i1img1",
                    fileName: "example2.jpg",
                    uri: require("@/assets/images/example2.jpg"),
                },
            ],
            selectedImageId: "s2i1img1",
            gpsLocation: {
                latitude: 111.121,
                longitude: -111.121,
            },
            gpsTimestamp: new Date("2026-03-23T18:22:00"),
            licensePlate: "TUC555",
            riderNotes: "Vehicle passed too closely.",
            session: session2,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: null,
            riderNotes: null,
            session: session2,
        },
    ];
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
    session4.incidents = [
        {
            imageFiles: [
                {
                    id: "s4i1img1",
                    fileName: "example3.jpg",
                    uri: require("@/assets/images/example3.jpg"),
                },
            ],
            selectedImageId: "s4i1img1",
            gpsLocation: {
                latitude: 111.131,
                longitude: -111.131,
            },
            gpsTimestamp: new Date("2026-03-21T06:58:00"),
            licensePlate: "GOOD44",
            riderNotes: "Car blocked lane during pickup.",
            session: session4,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.132,
                longitude: -111.132,
            },
            gpsTimestamp: new Date("2026-03-21T07:05:00"),
            licensePlate: "BIKE22",
            riderNotes: null,
            session: session4,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: "",
            riderNotes: "",
            session: session4,
        },
        {
            imageFiles: [
                {
                    id: "s4i4img1",
                    fileName: "example4.jpg",
                    uri: require("@/assets/images/example4.jpg"),
                },
            ],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.134,
                longitude: -111.134,
            },
            gpsTimestamp: new Date("2026-03-21T07:15:00"),
            licensePlate: "LATE77",
            riderNotes: "Opened door into bike lane.",
            session: session4,
        },
    ];
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
        {
            imageFiles: [
                {
                    id: "s5i3img1",
                    fileName: "example.jpg",
                    uri: require("@/assets/images/example.jpg"),
                },
            ],
            selectedImageId: "s5i3img1",
            gpsLocation: {
                latitude: 111.141,
                longitude: -111.141,
            },
            gpsTimestamp: new Date("2026-03-20T18:05:00"),
            licensePlate: "CLEAR5",
            riderNotes: "Merged into lane without signaling.",
            session: session5,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.142,
                longitude: -111.142,
            },
            gpsTimestamp: null,
            licensePlate: "MISS55",
            riderNotes: "Too close while passing.",
            session: session5,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: null,
            riderNotes: "Only partial report entered.",
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
        {
            imageFiles: [
                {
                    id: "s7i2img1",
                    fileName: "example2.jpg",
                    uri: require("@/assets/images/example2.jpg"),
                },
            ],
            selectedImageId: "s7i2img1",
            gpsLocation: {
                latitude: 111.151,
                longitude: -111.151,
            },
            gpsTimestamp: new Date("2026-03-17T12:44:00"),
            licensePlate: "PASS77",
            riderNotes: "Close pass captured clearly.",
            session: session7,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.152,
                longitude: -111.152,
            },
            gpsTimestamp: new Date("2026-03-17T12:49:00"),
            licensePlate: "",
            riderNotes: "",
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
    session8.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: null,
            riderNotes: null,
            session: session8,
        },
    ];
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
        {
            imageFiles: [
                {
                    id: "s9i2img1",
                    fileName: "example3.jpg",
                    uri: require("@/assets/images/example3.jpg"),
                },
            ],
            selectedImageId: "s9i2img1",
            gpsLocation: {
                latitude: 111.161,
                longitude: -111.161,
            },
            gpsTimestamp: new Date("2026-03-15T19:20:00"),
            licensePlate: "NIGHT9",
            riderNotes: "Car drifted into shoulder.",
            session: session9,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.162,
                longitude: -111.162,
            },
            gpsTimestamp: new Date("2026-03-15T19:28:00"),
            licensePlate: "SIDE01",
            riderNotes: null,
            session: session9,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: "",
            riderNotes: "Need to finish details later.",
            session: session9,
        },
        {
            imageFiles: [
                {
                    id: "s9i5img1",
                    fileName: "example4.jpg",
                    uri: require("@/assets/images/example4.jpg"),
                },
            ],
            selectedImageId: "s9i5img1",
            gpsLocation: {
                latitude: 111.163,
                longitude: -111.163,
            },
            gpsTimestamp: new Date("2026-03-15T19:35:00"),
            licensePlate: "DONE09",
            riderNotes: "Complete incident record.",
            session: session9,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: new Date("2026-03-15T19:38:00"),
            licensePlate: null,
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
        {
            imageFiles: [
                {
                    id: "s11i3img1",
                    fileName: "example.jpg",
                    uri: require("@/assets/images/example.jpg"),
                },
            ],
            selectedImageId: "s11i3img1",
            gpsLocation: {
                latitude: 111.171,
                longitude: -111.171,
            },
            gpsTimestamp: new Date("2026-03-12T09:06:00"),
            licensePlate: "OK1111",
            riderNotes: "Complete record with image.",
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
    session12.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.181,
                longitude: -111.181,
            },
            gpsTimestamp: new Date("2026-03-11T18:00:00"),
            licensePlate: "HALF12",
            riderNotes: "",
            session: session12,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: null,
            riderNotes: null,
            session: session12,
        },
    ];
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
        {
            imageFiles: [
                {
                    id: "s14i2img1",
                    fileName: "example2.jpg",
                    uri: require("@/assets/images/example2.jpg"),
                },
            ],
            selectedImageId: "s14i2img1",
            gpsLocation: {
                latitude: 111.191,
                longitude: -111.191,
            },
            gpsTimestamp: new Date("2026-03-09T13:36:00"),
            licensePlate: "GOOD14",
            riderNotes: "Complete incident entry.",
            session: session14,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: "",
            riderNotes: "Need to add GPS later.",
            session: session14,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.193,
                longitude: -111.193,
            },
            gpsTimestamp: new Date("2026-03-09T13:41:00"),
            licensePlate: null,
            riderNotes: null,
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
    session15.incidents = [
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: "",
            riderNotes: "",
            session: session15,
        },
    ];
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
        {
            imageFiles: [
                {
                    id: "s16i2img1",
                    fileName: "example3.jpg",
                    uri: require("@/assets/images/example3.jpg"),
                },
            ],
            selectedImageId: "s16i2img1",
            gpsLocation: {
                latitude: 111.201,
                longitude: -111.201,
            },
            gpsTimestamp: new Date("2026-03-07T18:46:00"),
            licensePlate: "WALK16",
            riderNotes: "Complete record.",
            session: session16,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.202,
                longitude: -111.202,
            },
            gpsTimestamp: new Date("2026-03-07T18:52:00"),
            licensePlate: "MISS16",
            riderNotes: "",
            session: session16,
        },
        {
            imageFiles: [],
            selectedImageId: null,
            gpsLocation: null,
            gpsTimestamp: null,
            licensePlate: null,
            riderNotes: "Only note saved.",
            session: session16,
        },
        {
            imageFiles: [
                {
                    id: "s16i5img1",
                    fileName: "example4.jpg",
                    uri: require("@/assets/images/example4.jpg"),
                },
            ],
            selectedImageId: null,
            gpsLocation: {
                latitude: 111.203,
                longitude: -111.203,
            },
            gpsTimestamp: new Date("2026-03-07T19:00:00"),
            licensePlate: "PIC160",
            riderNotes: "Image saved but not selected.",
            session: session16,
        },
        {
            imageFiles: [
                {
                    id: "s16i6img1",
                    fileName: "example.jpg",
                    uri: require("@/assets/images/example.jpg"),
                },
            ],
            selectedImageId: "s16i6img1",
            gpsLocation: {
                latitude: 111.204,
                longitude: -111.204,
            },
            gpsTimestamp: new Date("2026-03-07T19:03:00"),
            licensePlate: "FULL16",
            riderNotes: "Another complete incident.",
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
        {
            imageFiles: [
                {
                    id: "s18i2img1",
                    fileName: "example2.jpg",
                    uri: require("@/assets/images/example2.jpg"),
                },
            ],
            selectedImageId: "s18i2img1",
            gpsLocation: {
                latitude: 111.211,
                longitude: -111.211,
            },
            gpsTimestamp: new Date("2026-03-05T17:10:00"),
            licensePlate: "LAST18",
            riderNotes: "Complete final mock incident.",
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
*/