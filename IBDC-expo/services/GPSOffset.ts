import type { LocationObject } from 'expo-location';
import type { Coordinates } from "expo-location/next";

/**
 * These const values are arbitrarily chosen as of now 11/5/26. These are used to determine which strategy to use and if
 * a specified amount of elapsed time since an incident occurred is valid or not.
 */
const CLOSEST: number = 1000;
const MID: number = 5000;
const FARTHEST: number = 10000;

/**
 * Previous and next GPS Ping for the closest selected ping. These can be null depending on where in the array
 * the chosen ping is.
 */
type GPSNeighbors = {
    prev: LocationObject | null,
    next: LocationObject | null
};

/**
 * Used to determine what type of GPS location estimation strategy to use
 */
type GPSDecisionNode = {
    GPSLocation: LocationObject,
    GPSNeighbors: GPSNeighbors,
    timeOfIncident: number
};

/**
 * These named strategies come from popular location estimation techniques
 */
enum STRATEGY {
    EXACT_PING,
    DEAD_RECKONING,
    LINEAR_INTERPOLATION,
}

/**
 * Creates an object containing data used to determine the best way to estimate GPS location
 * @param GPS_Pings list of all current pings for current ride session
 * @param time_offset time elapsed from initial IBDC device trigger
 * @param current_time time event was received by the application
 * @returns bundled GPSLocation for chosen ping, neighbors and incident time
 */
function createInformationNode(GPS_Pings: LocationObject[], time_offset: number, current_time: number): GPSDecisionNode {
    const incidentTime: number = current_time - time_offset;
    const targetPing: LocationObject = findClosestPing(incidentTime, GPS_Pings);
    const neighbors: GPSNeighbors = determineNeighbors(GPS_Pings, targetPing);
    return {
        GPSLocation: targetPing,
        GPSNeighbors: neighbors,
        timeOfIncident: incidentTime,
    }
}

/**
 * Finds the closest ping (in time) relative to the time of the incident
 * @param time_of_incident estimated time incident occured
 * @param GPS_Pings list of GPSPings for current ride session
 * @returns the closest GPS Ping to the time of the incident
 */
function findClosestPing(time_of_incident: number, GPS_Pings: LocationObject[]): LocationObject {

    if (GPS_Pings.length === 0) {
        throw new Error('No GPS data stored for this ride session.');
    }


    // Snapshot of GPS pings for current ride session at this point in time. These are sorted
    // ascending and chronologically. (Ability to use binary search)
    let list: LocationObject[] =[...GPS_Pings];


    // Start binary search algorithm here
    // Target -> the smallest difference between |timeOfIncident - GPS[i].time|
    // If found within an acceptable range of error, return GPS [i]
    // If list.size == 0, try with medium and far precision. If still not found, return something

    let leftBoundary: number = 0;
    let rightBoundary: number = list.length - 1;

    while (leftBoundary <= rightBoundary) {
        const midPoint: number = Math.floor((leftBoundary + rightBoundary) / 2);

        // Compare GPS_Pings[mid].timestamp
        // against timeOfIncident.
        // --------------------------------
        // If earlier: move left boundary
        // If later: move right boundary
        // If equal: return exact match
        if (list[midPoint].timestamp > time_of_incident) {
            leftBoundary = midPoint;
        }
        else if (list[midPoint].timestamp < time_of_incident) {
            rightBoundary = midPoint;
        }
        else if (list[midPoint].timestamp === time_of_incident) {
            return list[midPoint];
        }
    }

    // At this point, the leftBoundary should be <= the incident time and right should be >=
    //  Check the valid neighboring candidates at left and right. (Check to make sure boundaries are valid)
    if (leftBoundary < 0) {
        return list[rightBoundary];
    }
    if (rightBoundary >= list.length) {
        return list[leftBoundary];
    }

    // Calculate their absolute time differences.
    const t1:number = Math.abs(list[leftBoundary].timestamp - time_of_incident);
    const t2:number = Math.abs(list[rightBoundary].timestamp - time_of_incident);

    // Return the closest candidate.
    return t1 <= t2 ? list[rightBoundary] : list[rightBoundary];
}

/**
 * Finds the neighboring LocationObjects of the chosen Location
 * @param target_ping ping closest to time of incident
 * @param GPS_Pings the snapshot of GPS Pings for a ride session
 * @returns the neighbors of the target GPS ping if they exist
 */
function determineNeighbors(GPS_Pings: LocationObject[], target_ping: LocationObject): GPSNeighbors {

    let neighbors: GPSNeighbors = {
        prev: null,
        next: null,
    };
    /*
    if (leftBound > 0) {
        neighbors.prev = GPS_Pings[leftBound];
    }
    if (rightBound < GPS_Pings.length - 1) {
        neighbors.next = GPS_Pings[rightBound];
    }
     */
    for (let i = 0; i < GPS_Pings.length; i++) {
        if (GPS_Pings[i].timestamp === target_ping.timestamp) {
            if (i - 1 > 0) {
                neighbors.prev = GPS_Pings[i - 1];
            }
            if (i + 1 < GPS_Pings.length - 1)
            {
                neighbors.next = GPS_Pings[i + 1];
            }
            break;
        }
    }
    return neighbors;
}

/**
 * Uses a strategy and GPSLocation information to calculate the coordinates of the incident
 * @param strategy the chosen method for estimating the coordinates
 * @param GPS_Info additional necessary information for the strategies to complete their work
 * @returns the best estimate for incident coordinates
 */
function getCoordinates(strategy: STRATEGY, GPS_Info: GPSDecisionNode): Coordinates {
    switch (strategy) {
        case STRATEGY.EXACT_PING:
            return implementExactPing(GPS_Info.GPSLocation);
        case STRATEGY.DEAD_RECKONING:
            return implementDeadReckoning(GPS_Info);
        case STRATEGY.LINEAR_INTERPOLATION:
            return implementLinearInterpolation(GPS_Info);
        default:
            return implementExactPing(GPS_Info.GPSLocation);
    }
}

/**
 * GPSLocation was taken <= CLOSEST> time, this should be representative of the actual incident location
 * @param GPS_Ping closest ping at time of incident
 * @returns the best estimate for incident coordinates
 */
function implementExactPing(GPS_Ping: LocationObject): Coordinates {
    return GPS_Ping.coords
}

/**
 *
 * @param GPS_Info
 * @return the best estimate for incident coordinates
 */
function implementDeadReckoning(GPS_Info: GPSDecisionNode): Coordinates {
    return {
        latitude: 0.0,
        longitude: 0.0
    }
}

/**
 *
 * @param GPS_Info
 * @returns the best estimate for incident coordinates
 */
function implementLinearInterpolation(GPS_Info: GPSDecisionNode): Coordinates {
    return {
        latitude: 0.0,
        longitude: 0.0
    }
}

/**
 * This function does the heaviest lifting when it comes to logic for this class. This takes information about
 * the incident, GPS_Locations around the incident to determine the most accurate way to estimate the GPS location.
 * @param Decision_Node
 * @returns the method of location estimation
 */
function determineStrategy(Decision_Node: GPSDecisionNode): STRATEGY {

    // Determine how close the chosen GPS ping was to the incident
    //let timeFromIncident: number = Math.abs(GPS_Ping.timestamp - incident_time);

    // This GPS ping was captured very close to the time of the incident
    if (Decision_Node.timeOfIncident <= CLOSEST) {
        return STRATEGY.EXACT_PING;
    }
    return STRATEGY.EXACT_PING;
    // More strategies need to be explored here. Depending on velocity, angular acceleration, time since the incident,
    // different strategies can be employed to get the most accurate GPS position

}












