import { BlindLevel } from './blind-level.interface';
import { Player } from './player.interface';
import { Finish } from './finish.interface';

export interface Tournament {
    id?: number;
    name: string;
    date: Date;
    maxPlayers: number;
    noOfTables: number;
    buyIn: number;
    noOfRebuys: number;
    rebuy: number;
    addonAmount: number;
    addon: number;
    payout: string;
    initialPricepool: number;
    startStack: number;
    location: number;
    structure: BlindLevel[];
    players: Player[];
    entries: any[]; //Entry[];
    finishes: Finish[];
}
