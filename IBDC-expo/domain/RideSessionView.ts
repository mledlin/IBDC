import {isIncidentComplete, type Incident} from "./Incident";

export const DEFAULT_SESSIONS_PER_PAGE = 5;

export type RideSessionLike = {
    incidents: Incident[];
};

export type RideSessionViewState = {
    currentPage: number;
    showFilters: boolean;
    filterHasIncidents: boolean;
    filterActionRequired: boolean;
};

export type RideSessionViewAction =
    | { type: "toggleFilterPanel" }
    | { type: "toggleHasIncidents" }
    | { type: "toggleActionRequired" }
    | { type: "clearFilters" }
    | { type: "setPage"; page: number }
    | { type: "clampPage"; maxPage: number }
    | { type: "resetPage" };

export const INITIAL_RIDE_SESSION_VIEW_STATE: RideSessionViewState = {
    currentPage: 0,
    showFilters: false,
    filterHasIncidents: false,
    filterActionRequired: false,
};

/**
 * Returns true when at least one incident in a ride session is incomplete.
 */
export function sessionHasActionRequired(
    session: RideSessionLike,
): boolean {
    return session.incidents.some(
        (incident) => !isIncidentComplete(incident),
    );
}

/**
 * Applies the Ride Sessions filters while preserving the
 * screen's current OR behavior.
 */
export function filterRideSessions<T extends RideSessionLike>(
    sessions: T[],
    filterHasIncidents: boolean,
    filterActionRequired: boolean,
): T[] {
    return sessions.filter((session) => {
        if (!filterHasIncidents && !filterActionRequired) {
            return true;
        }

        const matchesHasIncidents =
            filterHasIncidents &&
            session.incidents.length > 0;

        const matchesActionRequired =
            filterActionRequired &&
            sessionHasActionRequired(session);

        return matchesHasIncidents || matchesActionRequired;
    });
}

/**
 * Selects the sessions visible on the requested page
 * and reports paging state.
 */
export function paginateRideSessions<T>(
    sessions: T[],
    currentPage: number,
    sessionsPerPage: number = DEFAULT_SESSIONS_PER_PAGE,
    ) {
    const startIndex = currentPage * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;

    return {
        visibleSessions: sessions.slice(startIndex, endIndex),
        startIndex,
        endIndex,
        hasNextPage: endIndex < sessions.length,
        hasPreviousPage: currentPage > 0,
    };
}

/**
 * Centralizes Ride Sessions filter and page-state changes
 * so the same behavior can be unit tested.
 */
export function rideSessionViewReducer(
    state: RideSessionViewState,
    action: RideSessionViewAction,
): RideSessionViewState {
    switch (action.type) {
        case "toggleFilterPanel":
            return {
                ...state,
                showFilters: !state.showFilters,
            };

        case "toggleHasIncidents":
            return {
                ...state,
                filterHasIncidents: !state.filterHasIncidents,
                currentPage: 0,
            };

        case "toggleActionRequired":
            return {
                ...state,
                filterActionRequired: !state.filterActionRequired,
                currentPage: 0,
            };

        case "clearFilters":
            return {
                ...state,
                filterHasIncidents: false,
                filterActionRequired: false,
                showFilters: false,
                currentPage: 0,
            };

        case "setPage":
            return {
                ...state,
                currentPage: action.page,
            };

        case "clampPage":
            return {
                ...state,
                currentPage: Math.min(
                    state.currentPage,
                    action.maxPage,
                ),
            };

        case "resetPage":
            return {
                ...state,
                currentPage: 0,
            };

        default:
            return state;
    }
}