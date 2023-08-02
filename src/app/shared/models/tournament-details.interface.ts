import { BlindLevel } from './blind-level.interface';
import { Player } from './player.interface';
import { Finish } from './finish.interface';

export interface TournamentDetails {
    id?: number;
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
    location: string;
    structure: BlindLevel[];
    players: Player[];
    entries: any[]; //Entry[];
    finishes: Finish[];
}
