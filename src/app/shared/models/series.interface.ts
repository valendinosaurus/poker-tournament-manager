import { Branding } from './branding.interface';
import { Tournament, TournamentS } from './tournament.interface';

export interface SeriesBase {
    id: number;
    name: string;
    shortDesc: string;
    longDesc: string;
    branding: Branding;
    finalTournament: Tournament;
    rankFormula: number;
    ftFormula: number;
    percentage: number;
    maxAmountPerTournament: number;
    noOfTournaments: number;
    finalists: number;
    password: string;
    temp: boolean;
    sub: string;
}

export interface Series extends SeriesBase {
    tournaments: Tournament[];
}

export interface SeriesS extends SeriesBase {
    tournaments: TournamentS[];
}

export interface SeriesModel extends Omit<Series, 'id' | 'branding' | 'finalTournament' | 'tournaments'> {
    id: number | undefined;
    branding: number;
    finalTournament: number;
}

export interface SeriesMetadata {
    id: number;
    rankFormula: number;
    percentage: number;
    maxAmountPerTournament: number;
    password: string;
}

