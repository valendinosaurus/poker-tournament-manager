import { BlindLevel } from './blind-level.interface';
import { Player } from './player.interface';
import { Finish } from './finish.interface';
import { Entry } from './entry.interface';

export interface AdminTournament {
    id: number;
    name: string;
    date: Date;
    location: string;
    temp: boolean;
}

export interface TournamentDetails {
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
    payout: number;
    initialPricePool: number;
    rankFormula: number | null;
    location: number;
    password: string;
    locationName: string;
    structure: BlindLevel[];
    players: Player[];
    entries: Entry[];
    finishes: Finish[];
    temp: boolean;
}
