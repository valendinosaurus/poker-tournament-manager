import { BlindLevel } from './blind-level.interface';
import { Player, PlayerInSeries } from './player.interface';
import { Finish } from './finish.interface';
import { Entry } from './entry.interface';
import { Elimination } from './elimination.interface';
import { TEvent } from './t-event.interface';
import { TournamentSettings } from './tournament-settings.interface';
import { RankFormula } from './rank-formula.interface';

export interface TournamentBase {
    id: number;
    name: string;
    date: Date;
    maxPlayers: number;
    buyInAmount: number;
    startStack: number;
    withReEntry: boolean;
    noOfReEntries: number;
    withRebuy: boolean;
    noOfRebuys: number;
    rebuyAmount: number;
    rebuyStack: number;
    withAddon: boolean;
    addonStack: number;
    addonAmount: number;
    withBounty: boolean;
    bountyAmount: number;
    payout: number;
    initialPricePool: number;
    rankFormula: RankFormula | null;
    location: number;
    locationName: string;
    structure: BlindLevel[];
    entries: Entry[];
    finishes: Finish[];
    eliminations: Elimination[];
    liveTicker: TEvent[];
    temp: boolean;
    password: string;
    locked: boolean;
    adaptedPayout: number[] | undefined;
    settings: TournamentSettings;
}

export interface AdminTournament {
    id: number;
    name: string;
    date: Date;
    location: string;
    temp: boolean;
    locked: boolean;
    levels: number;
    players: number;
}

export interface Tournament extends TournamentBase {
    players: Player[];
}

export interface TournamentS extends TournamentBase {
    players: PlayerInSeries[];
}

type omitted =
    'id'
    | 'date'
    | 'liveTicker'
    | 'locationName'
    | 'eliminations'
    | 'finishes'
    | 'entries'
    | 'structure'
    | 'players'
    | 'rankFormula';

export interface TournamentModel extends Omit<Tournament, omitted> {
    id: number | undefined;
    date: string;
    rankFormula: number | null;
}
