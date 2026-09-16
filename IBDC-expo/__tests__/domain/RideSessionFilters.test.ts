import {
    DEFAULT_SESSIONS_PER_PAGE,
    filterRideSessions,
    paginateRideSessions,
    sessionHasActionRequired,
} from "@/domain/RideSessionView";

import {
    makeIncident,
    makeIncompleteIncident,
    makeSession,
} from "../factories/RideSessionFactory";

describe("Ride Session filtering", () => {
    test("Default history view shows all sessions subject to the default page size", () => {
        // Arrange
        const sessions = Array.from(
            {length: 7},
            (_, index) =>
                makeSession(`session-${index + 1}`),
        );

        // Act
        const filteredSessions =
            filterRideSessions(
                sessions,
                false,
                false,
            );

        const page =
            paginateRideSessions(
                filteredSessions,
                0,
            );

        // Assert
        expect(filteredSessions).toHaveLength(7);

        expect(
            page.visibleSessions.map(
                (session) => session.id,
            ),
        ).toEqual([
            "session-1",
            "session-2",
            "session-3",
            "session-4",
            "session-5",
        ]);

        expect(
            page.visibleSessions,
        ).toHaveLength(
            DEFAULT_SESSIONS_PER_PAGE,
        );

        expect(page.hasNextPage).toBe(true);
    });

    test("Has Incidents displays only sessions containing one or more incidents", () => {
        // Arrange
        const sessions = [
            makeSession("empty-1"),

            makeSession(
                "complete",
                [
                    makeIncident({
                        id: "complete-1",
                    }),
                ],
            ),

            makeSession(
                "incomplete",
                [
                    makeIncompleteIncident(
                        "incomplete-1",
                    ),
                ],
            ),

            makeSession("empty-2"),
        ];

        // Act
        const result =
            filterRideSessions(
                sessions,
                true,
                false,
            );

        // Assert
        expect(
            result.map(
                (session) => session.id,
            ),
        ).toEqual([
            "complete",
            "incomplete",
        ]);
    });

    test("Action Required displays only sessions containing at least one incomplete incident", () => {
        // Arrange
        const sessions = [
            makeSession("empty"),

            makeSession(
                "complete",
                [
                    makeIncident({
                        id: "complete-1",
                    }),
                ],
            ),

            makeSession(
                "incomplete",
                [
                    makeIncompleteIncident(
                        "incomplete-1",
                    ),
                ],
            ),

            makeSession(
                "mixed",
                [
                    makeIncident({
                        id: "mixed-complete",
                    }),

                    makeIncompleteIncident(
                        "mixed-incomplete",
                    ),
                ],
            ),
        ];

        // Act
        const result =
            filterRideSessions(
                sessions,
                false,
                true,
            );

        // Assert
        expect(
            result.map(
                (session) => session.id,
            ),
        ).toEqual([
            "incomplete",
            "mixed",
        ]);
    });

    test("Combined filters preserve the established OR behavior", () => {
        // Arrange
        const sessions = [
            makeSession("empty"),

            makeSession(
                "complete",
                [
                    makeIncident({
                        id: "complete-1",
                    }),
                ],
            ),

            makeSession(
                "incomplete",
                [
                    makeIncompleteIncident(
                        "incomplete-1",
                    ),
                ],
            ),
        ];

        // Act
        const result =
            filterRideSessions(
                sessions,
                true,
                true,
            );

        // Assert
        expect(
            result.map(
                (session) => session.id,
            ),
        ).toEqual([
            "complete",
            "incomplete",
        ]);
    });

    test("Needs Review is true when a session contains at least one incomplete incident", () => {
        // Arrange
        const completeSession =
            makeSession(
                "complete",
                [
                    makeIncident({
                        id: "complete-1",
                    }),
                ],
            );

        const needsReviewSession =
            makeSession(
                "needs-review",
                [
                    makeIncident({
                        id: "complete-2",
                    }),

                    makeIncompleteIncident(
                        "incomplete-1",
                    ),
                ],
            );

        // Act / Assert
        expect(
            sessionHasActionRequired(
                completeSession,
            ),
        ).toBe(false);

        expect(
            sessionHasActionRequired(
                needsReviewSession,
            ),
        ).toBe(true);
    });
});