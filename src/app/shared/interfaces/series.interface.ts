import { Branding } from './branding.interface';
import { Tournament, TournamentS } from './tournament.interface';
import { RankFormula } from './rank-formula.interface';
import { Signal, WritableSignal } from '@angular/core';

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

export interface CreateSeriesModel {
    id: WritableSignal<number | undefined>;
    name: WritableSignal<string>;
    shortDesc: WritableSignal<string>;
    longDesc: WritableSignal<string>;
    branding: WritableSignal<number>;
    finalTournament: WritableSignal<number>;
    rankFormula: WritableSignal<number>;
    ftFormula: WritableSignal<number>;
    percentage: WritableSignal<number>;
    maxAmountPerTournament: WritableSignal<number>;
    noOfTournaments: WritableSignal<number>;
    finalists: WritableSignal<number>;
    password: WritableSignal<string>;
    temp: WritableSignal<boolean>;
    locked: WritableSignal<boolean>;
    ownerEmail: WritableSignal<string>;
    showPrices: WritableSignal<boolean>;
    showNonItmPlaces: WritableSignal<boolean>;
    showEliminations: WritableSignal<boolean>;
    showLiveTicker: WritableSignal<boolean>;
    showAverageRank: WritableSignal<boolean>;
    isValid: Signal<boolean>;
}

export interface SeriesMetadata {
    id: number;
    rankFormula: RankFormula;
    percentage: number;
    maxAmountPerTournament: number;
    password: string;
}

