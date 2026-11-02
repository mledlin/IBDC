import type { LocationObject } from 'expo-location';

const precisionsInMS = {
    "closest": 1000, // 1 second
    "mid": 2000, // 2 seconds
    "farthest": 5000, // 5 seconds
}


/**
 * @ return returns the GPS ping closest to the time_offset
 */
function findClosesetPing(time_offset: number, current_time: number, GPS_Pings: LocationObject[]): LocationObject {

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

        // TODO: Compare GPS_Pings[mid].timestamp
        // against timeOfIncident.
        //
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
    // TODO: Check the valid neighboring candidates at left and right. (Check to make sure boundaries are valid)
    if (rightBoundary < 0) {
        return list[leftBoundary];
    }
    if (leftBoundary >= list.length) {
        return list[rightBoundary];
    }

    // TODO: Calculate their absolute time differences.
    const t1:number = Math.abs(list[leftBoundary].timestamp - timeOfIncident);
    const t2:number = Math.abs(list[rightBoundary].timestamp - timeOfIncident);

    // TODO: Return the closest candidate.
    return t1 <= t2 ? list[rightBoundary] : list[rightBoundary];
}







