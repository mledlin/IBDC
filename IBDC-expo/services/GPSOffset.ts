import type { LocationObject } from 'expo-location';
import type { Coordinates } from "expo-location/next";

const CLOSEST: number = 1000;
const MID: number = 5000;
const FARTHEST: number = 10000;

type GPSNeighbors = {
    prev: LocationObject | null,
    next: LocationObject | null
};

enum STRATEGY {
    EXACT_PING,
    DEAD_RECKONING,
    LINEAR_INTERPOLATION,
}

/**
 *
 * @param time_offset time elapsed since event detection from IBDC
 * @param current_time time event notification was received into application
 * @param GPS_Pings list of GPSPings for current ride session
 * @returns the closest GPS Ping to the time of the incident
 */
function findClosestPing(time_offset: number, current_time: number, GPS_Pings: LocationObject[]): LocationObject {

    if (GPS_Pings.length === 0) {
        throw new Error('No GPS data stored for this ride session.');
    }


    // Snapshot of GPS pings for current ride session at this point in time. These are sorted
    // ascending and chronologically. (Ability to use binary search)
    let list: LocationObject[] =[...GPS_Pings];

    // Best estimate of incident time
    const timeOfIncident: number = current_time - time_offset;

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
        if (list[midPoint].timestamp > timeOfIncident) {
            leftBoundary = midPoint;
        }
        else if (list[midPoint].timestamp < timeOfIncident) {
            rightBoundary = midPoint;
        }
        else if (list[midPoint].timestamp === timeOfIncident) {
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
    const t1:number = Math.abs(list[leftBoundary].timestamp - timeOfIncident);
    const t2:number = Math.abs(list[rightBoundary].timestamp - timeOfIncident);

    // Return the closest candidate.
    return t1 <= t2 ? list[rightBoundary] : list[rightBoundary];
}

/**
 *
 * @param GPS_Pings the snapshot of GPS Pings for a ride session
 * @param leftBound the left boundary point of the binary search algorithm
 * @param rightBound the right boundary point of the binary search algorithm
 * @returns the neighbors of the target GPS ping if they exist
 */
function determineNeighbors(GPS_Pings: LocationObject[], leftBound: number, rightBound: number): GPSNeighbors {

    let neighbors: GPSNeighbors = {
        prev: null,
        next: null,
    };

    if (leftBound > 0) {
        neighbors.prev = GPS_Pings[leftBound];
    }
    if (rightBound < GPS_Pings.length - 1) {
        neighbors.next = GPS_Pings[rightBound];
    }
    return neighbors;
}

function determineStrategy(GPS_Ping: LocationObject, Neighbors: GPSNeighbors, incident_time: number): STRATEGY {

    // Determine how close the chosen GPS ping was to the incident
    let timeFromIncident: number = Math.abs(GPS_Ping.timestamp - incident_time);

    // This GPS ping was captured very close to the time of the incident
    if (timeFromIncident <= CLOSEST) {
        return STRATEGY.EXACT_PING;
    }
    return STRATEGY.EXACT_PING;
    // More strategies need to be explored here. Depending on velocity, angular acceleration, time since the incident,
    // different strategies can be employed to get the most accurate GPS position

}

function calculateGPSLocation(GPS_Ping: LocationObject, Neighbors: GPSNeighbors, strategy: STRATEGY) {
    if (strategy === STRATEGY.EXACT_PING) {
        return GPS_Ping;
    }

}











