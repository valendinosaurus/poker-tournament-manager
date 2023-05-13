import {Tournamnet} from "./tournament.interface";

export interface TournamentSeries {
    name: string;
    start: Date;
    end?: Date;
    tournaments: Tournamnet[];
}
