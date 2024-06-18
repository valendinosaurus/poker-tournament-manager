import { Branding } from './branding.interface';
import { Tournament, TournamentS } from './tournament.interface';
import { RankFormula } from './rank-formula.interface';

export interface SeriesBase {
    id: number;
    name: string;
    shortDesc: string;
    longDesc: string;
    branding: Branding;
    finalTournament: Tournament;
    rankFormula: RankFormula;
    ftFormula: number;
    percentage: number;
    maxAmountPerTournament: number;
    noOfTournaments: number;
    finalists: number;
    password: string;
    temp: boolean;
    sub: string;
    locked: boolean;
    ownerEmail: string | null;
    showPrices: boolean;
    showNonItmPlaces: boolean;
    showEliminations: boolean;
    showLiveTicker: boolean;
    showAverageRank: boolean;
}

export interface Series extends SeriesBase {
    tournaments: Tournament[];
}

export interface SeriesS extends SeriesBase {
    tournaments: TournamentS[];
}

export interface SeriesModel extends Omit<Series, 'id' | 'rankFormula' | 'branding' | 'finalTournament' | 'tournaments' | 'sub'> {
    id: number | undefined;
    branding: number;
    finalTournament: number;
    rankFormula: number;
}

export interface SeriesMetadata {
    id: number;
    rankFormula: RankFormula;
    percentage: number;
    maxAmountPerTournament: number;
    password: string;
}

