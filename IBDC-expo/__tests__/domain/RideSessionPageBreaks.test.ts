import {
    filterRideSessions,
    INITIAL_RIDE_SESSION_VIEW_STATE,
    paginateRideSessions,
    rideSessionViewReducer,
} from "@/domain/RideSessionView";

import {
    makeIncident,
    makeSession,
} from "../factories/RideSessionFactory";

describe("Ride Session filter and page state", () => {
    test("Clear filters restores all sessions and returns to page 1", () => {
        // Arrange
        const sessions = [
            makeSession("empty"),
            makeSession(
                "with-incident",
                [
                    makeIncident({
                        id: "incident-1",
                    }),
                ],
            ),
        ];

        const activeState = {
            ...INITIAL_RIDE_SESSION_VIEW_STATE,
            currentPage: 2,
            showFilters: true,
            filterHasIncidents: true,
            filterActionRequired: true,
        };

        // Act
        const clearedState =
            rideSessionViewReducer(
                activeState,
                {
                    type: "clearFilters",
                },
            );

        const result =
            filterRideSessions(
                sessions,
                clearedState.filterHasIncidents,
                clearedState.filterActionRequired,
            );

        // Assert
        expect(clearedState.currentPage).toBe(0);
        expect(clearedState.showFilters).toBe(false);
        expect(clearedState.filterHasIncidents).toBe(false);
        expect(clearedState.filterActionRequired).toBe(false);

        expect(
            result.map(
                (session) => session.id,
            ),
        ).toEqual([
            "empty",
            "with-incident",
        ]);
    });

    test("Next and Previous pages do not skip or duplicate sessions", () => {
        // Arrange
        const sessions = Array.from(
            {length: 12},
            (_, index) =>
                makeSession(
                    `session-${index + 1}`,
                ),
        );

        // Act
        const firstPage =
            paginateRideSessions(
                sessions,
                0,
            );

        const secondPage =
            paginateRideSessions(
                sessions,
                1,
            );

        const thirdPage =
            paginateRideSessions(
                sessions,
                2,
            );

        const displayedIds = [
            ...firstPage.visibleSessions,
            ...secondPage.visibleSessions,
            ...thirdPage.visibleSessions,
        ].map(
            (session) => session.id,
        );

        // Assert
        expect(
            secondPage.hasPreviousPage,
        ).toBe(true);

        expect(
            secondPage.hasNextPage,
        ).toBe(true);

        expect(displayedIds).toEqual(
            sessions.map(
                (session) => session.id,
            ),
        );

        expect(
            new Set(displayedIds).size,
        ).toBe(
            sessions.length,
        );
    });

    test("Page boundaries disable Previous on page 1 and Next on the final page", () => {
        // Arrange
        const sessions = Array.from(
            {length: 12},
            (_, index) =>
                makeSession(
                    `session-${index + 1}`,
                ),
        );

        // Act
        const firstPage =
            paginateRideSessions(
                sessions,
                0,
            );

        const finalPage =
            paginateRideSessions(
                sessions,
                2,
            );

        // Assert
        expect(
            firstPage.hasPreviousPage,
        ).toBe(false);

        expect(
            firstPage.hasNextPage,
        ).toBe(true);

        expect(
            finalPage.hasPreviousPage,
        ).toBe(true);

        expect(
            finalPage.hasNextPage,
        ).toBe(false);

        expect(
            finalPage.visibleSessions.map(
                (session) => session.id,
            ),
        ).toEqual([
            "session-11",
            "session-12",
        ]);
    });

    // Runs as 2 separate tests!
    test.each([
        [
            "Has Incidents",
            "toggleHasIncidents" as const,
        ],
        [
            "Action Required",
            "toggleActionRequired" as const,
        ],
    ])(
        "Applying the %s filter resets the displayed page to page 1",
        (_name, actionType) => {
            // Arrange
            const state = {
                ...INITIAL_RIDE_SESSION_VIEW_STATE,
                currentPage: 3,
            };

            // Act
            const result =
                rideSessionViewReducer(
                    state,
                    {
                        type: actionType,
                    },
                );

            // Assert
            expect(
                result.currentPage,
            ).toBe(0);
        },
    );
});