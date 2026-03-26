import {Incident} from "@/domain/Incident";
import {GpsCoordinates} from "@/domain/Incident";

export type Session = {
    incidents : Incident[];
    lastGPSCoordinate : GpsCoordinates | null;
    lastGPSTime : Date | null;
    startDateStamp : Date | null;
};
