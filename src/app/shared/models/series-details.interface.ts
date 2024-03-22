import { Branding } from './branding.interface';
import { Tournament, TournamentS } from './tournament.interface';

export interface SeriesDetails {
    id: number;
    name: string;
    shortDesc: string;
    longDesc: string;
    branding: Branding;
    tournaments: Tournament[];
    finalTournament: Tournament;
    rankFormula: number;
    ftFormula: number;
    percentage: number;
    maxAmountPerTournament: number;
    noOfTournaments: number;
    finalists: number;
    password: string;
}

export interface SeriesDetailsS {
    id: number;
    name: string;
    shortDesc: string;
    longDesc: string;
    branding: Branding;
    tournaments: TournamentS[];
    finalTournament: Tournament;
    rankFormula: number;
    ftFormula: number;
    percentage: number;
    maxAmountPerTournament: number;
    noOfTournaments: number;
    finalists: number;
    password: string;
}

