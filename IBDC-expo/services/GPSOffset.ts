import type { LocationObject } from 'expo-location';

/**
 * These const values are arbitrarily chosen as of now 11/5/26. These are used to determine which strategy to use and if
 * a specified amount of elapsed time since an incident occurred is valid or not.
 */
const CLOSEST_MS: number = 1000;
const MID_MS: number = 5000;
const FARTHEST_MS: number = 10000;

/**
 * Previous and next GPS Ping for the closest selected ping. These can be null depending on where in the array
 * the chosen ping is.
 */
type GPSNeighbors = {
    prev: LocationObject | null,
    next: LocationObject | null
};

type Coordinates = {
    latitude: number;
    longitude: number;
}

/**
 * Used to determine what type of GPS location estimation strategy to use
 */
type GPSDecisionNode = {
    GPSLocation: LocationObject,
    GPSNeighbors: GPSNeighbors,
    temporalProximityToIncidentInMs: number,
    timeOfIncident: number,
};


/**
 * These named strategies come from popular location estimation techniques
 */
enum STRATEGY {
    EXACT_PING,
    DEAD_RECKONING,
    LINEAR_INTERPOLATION,
    DEFAULT
}

export default function getGPSCoordinates(GPS_Pings: LocationObject[], time_offset: number, current_time: number): Coordinates {
    const decisionInfo: GPSDecisionNode = createDecisionNode(GPS_Pings, time_offset, current_time);
    const strat: STRATEGY = determineStrategy(decisionInfo);
    return getCoordinates(strat, decisionInfo);
}

/**
 * Creates an object containing data used to determine the best way to estimate GPS location
 * @param GPS_Pings list of all current pings for current ride session
 * @param time_offset time elapsed from initial IBDC device trigger
 * @param current_time time event was received by the application
 * @returns bundled GPSLocation for chosen ping, neighbors and incident time
 */
function createDecisionNode(GPS_Pings: LocationObject[], time_offset: number, current_time: number): GPSDecisionNode {
    const incidentTime: number = current_time - time_offset;

    const targetPing: LocationObject = findClosestPing(incidentTime, GPS_Pings);

    // The time of the closest GPS ping - the time of the incident. If our GPS ping was taken exactly at the time
    // of the incident, this would be 0.
    const temporalProximityToIncident: number = incidentTime - targetPing.timestamp;

    const neighbors: GPSNeighbors = determineNeighbors(GPS_Pings, targetPing);
    return {
        GPSLocation: targetPing,
        GPSNeighbors: neighbors,
        temporalProximityToIncidentInMs: temporalProximityToIncident,
        timeOfIncident: incidentTime
    }
}

/**
 * Finds the closest ping (in time) relative to the time of the incident
 * @param time_of_incident estimated time incident occurred
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
            rightBoundary = midPoint - 1;
        }
        else if (list[midPoint].timestamp < time_of_incident) {
            leftBoundary = midPoint + 1;
        }
        else {
            return list[midPoint];
        }
    }

    // At this point, the leftBoundary should be <= the incident time and right should be >=
    //  Check the valid neighboring candidates at left and right. (Check to make sure boundaries are valid)
    if (rightBoundary < 0) {
        return list[leftBoundary];
    }

    if (leftBoundary >= list.length) {
        return list[rightBoundary];
    }

    // Calculate their absolute time differences.
    const t1:number = Math.abs(list[leftBoundary].timestamp - time_of_incident);
    const t2:number = Math.abs(list[rightBoundary].timestamp - time_of_incident);

    // Return the closest candidate.
    return t1 <= t2 ? list[leftBoundary] : list[rightBoundary];
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
            if (i - 1 >= 0) {
                neighbors.prev = GPS_Pings[i - 1];
            }

            if (i + 1 < GPS_Pings.length) {
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
    try {
        switch (strategy) {
            case STRATEGY.EXACT_PING:
                return implementExactPing(GPS_Info.GPSLocation);
            case STRATEGY.DEAD_RECKONING:
                return implementDeadReckoning(GPS_Info);
            case STRATEGY.LINEAR_INTERPOLATION:
                return implementLinearInterpolation(GPS_Info);
            default:
                return implementDefault(GPS_Info.GPSLocation);
        }
    } catch (error) {
        console.error(error);
        return implementDefault(GPS_Info.GPSLocation);
    }
}


/**
 * GPSLocation was taken <= CLOSEST time, this should be representative of the actual incident location
 * @param GPS_Ping closest ping at time of incident
 * @returns the best estimate for incident coordinates
 */
function implementExactPing(GPS_Ping: LocationObject): Coordinates {
    return GPS_Ping.coords
}

function implementDefault(GPS_Ping: LocationObject): Coordinates {
    return implementExactPing(GPS_Ping);
}

/**
 *
 * @param GPS_Info
 * @return the best estimate for incident coordinates
 */
function implementDeadReckoning(GPS_Info: GPSDecisionNode): Coordinates {
    const target: LocationObject = GPS_Info.GPSLocation;
    const { latitude, longitude, speed, heading } = target.coords;

    if (
        speed === null ||
        heading === null ||
        heading < 0 ||
        heading >= 360 ||
        !Number.isFinite(speed) ||
        speed < 0
    ) {
        throw new Error("Invalid speed or heading.");
    }

    // In METERS
    const RADIUS_OF_EARTH: number = 6371000;

    // Signed time difference in SECONDS
    const deltaTime: number = GPS_Info.temporalProximityToIncidentInMs / 1000;

    // Signed distance in METERS
    const distance: number = speed * deltaTime;

    // Convert heading and latitude to RADIANS
    const headingRad: number = heading * (Math.PI / 180);
    const latRad: number = latitude * (Math.PI / 180);

    // North/south and east/west displacement
    const deltaY: number = distance * Math.cos(headingRad);
    const deltaX: number = distance * Math.sin(headingRad);

    // Calculate coordinate offsets in DEGREES
    const deltaLat: number = (deltaY / RADIUS_OF_EARTH) * (180 / Math.PI);
    const cosLat = Math.cos(latRad);

    if (Math.abs(cosLat) < 1e-10) {
        throw new Error("Longitude estimate unstable near poles.");
    }

    const deltaLng =
        (deltaX / (RADIUS_OF_EARTH * cosLat)) *
        (180 / Math.PI);

    return {
        latitude: latitude + deltaLat,
        longitude: longitude + deltaLng
    };
}


/**
 *
 * @param GPS_Info GPS ping closest to the incident
 * @returns the best estimate for incident coordinates
 */
function implementLinearInterpolation(GPS_Info: GPSDecisionNode): Coordinates {
    const target: LocationObject = GPS_Info.GPSLocation;
    const neighbors: GPSNeighbors = GPS_Info.GPSNeighbors;
    const incidentTime: number = GPS_Info.timeOfIncident;

    // Select GPS pings bracketing the incident
    let previous: LocationObject;
    let next: LocationObject;

    if (incidentTime < target.timestamp) {
        // This would mean we can't interpolate at this point, which is an error because we entered the interpolation
        // function.
        if (neighbors.prev === null) {
            throw new Error("Missing previous GPS ping.");
        }

        previous = neighbors.prev;
        next = target;
    } else {
        if (neighbors.next === null) {
            throw new Error("Missing next GPS ping.");
        }

        previous = target;
        next = neighbors.next;
    }

    // Duration between the two GPS pings in MS
    const timeInterval: number = next.timestamp - previous.timestamp;

    if (timeInterval <= 0) {
        throw new Error("Invalid GPS timestamp interval.");
    }

    // Position of incident within the time interval
    const alpha: number = (incidentTime - previous.timestamp) / timeInterval;

    if (alpha < 0 || alpha > 1) {
        throw new Error("Incident is outside GPS interval.");
    }

    // Interpolate latitude and longitude
    const latitude: number = previous.coords.latitude + alpha * (next.coords.latitude - previous.coords.latitude);
    const longitude: number = previous.coords.longitude + alpha * (next.coords.longitude - previous.coords.longitude);

    return {
        latitude,
        longitude
    };
}

/**
 * Coordinates can be interpolated if the position is between two already known coordinates.
 * @param GPS_Info chosen GPS ping
 */
function canInterpolate(GPS_Info: GPSDecisionNode): boolean {
    const target: LocationObject = GPS_Info.GPSLocation;
    const neighbors: GPSNeighbors = GPS_Info.GPSNeighbors;

    const incidentTime: number = GPS_Info.timeOfIncident;

    if (incidentTime < target.timestamp) {
        return neighbors.prev !== null && neighbors.prev.timestamp <= incidentTime;
    }

    return neighbors.next !== null && neighbors.next.timestamp >= incidentTime;
}

/**
 * This function does the heaviest lifting when it comes to logic for this class. This takes information about
 * the incident and GPS_Locations around the incident to determine the most accurate way to estimate the coords of the
 * incident. This is a naive approach.
 * @param Decision_Node
 * @returns the method of location estimation
 */
function determineStrategy(Decision_Node: GPSDecisionNode): STRATEGY {
    const magnitudeOfElapsedTime: number = Math.abs(Decision_Node.temporalProximityToIncidentInMs);

    // This GPS ping was captured very close to the time of the incident
    if (magnitudeOfElapsedTime <= CLOSEST_MS) {
        return STRATEGY.EXACT_PING;
    }

    // A moderate amount of time has passed
    if (magnitudeOfElapsedTime <= MID_MS && canInterpolate(Decision_Node)) {
        return STRATEGY.LINEAR_INTERPOLATION;
    }

    // A large amount of time has passed, maybe too large of a gap to estimate accurately?
    if (magnitudeOfElapsedTime <= FARTHEST_MS) {
        return STRATEGY.DEAD_RECKONING
    }

    return STRATEGY.DEFAULT;
    // More strategies need to be explored here. Depending on velocity, angular acceleration, time since the incident,
    // different strategies can be employed to get the most accurate GPS position
}