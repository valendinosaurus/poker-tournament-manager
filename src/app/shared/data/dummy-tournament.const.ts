import { Tournament } from '../models/tournament.interface';
import { blindLevelsNoAnte } from './blind-levels.const';

export const dummyTourney: Tournament = {
    id: 1,
    date: new Date(),
    buyIn: 50,
    startStack: 10000,
    noOfRebuys: 0,
    rebuy: 0,
    addonAmount: 0,
    addon: 0,
    structure: blindLevelsNoAnte,
    name: 'Test',
    payout: '50 30 20',
    players: [],
    entries: [],
    initialPricepool: 0,
    maxPlayers: 9,
    noOfTables: 1,
    location: 1,
    finishes: []
};
