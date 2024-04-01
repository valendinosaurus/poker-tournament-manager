import { Tournament } from '../models/tournament.interface';
import { blindLevelsNoAnte } from './blind-levels.const';

export const dummyTourney: Tournament = {
    id: 1,
    date: new Date(),
    buyInAmount: 50,
    startStack: 10000,
    noOfRebuys: 0,
    rebuyAmount: 0,
    addonStack: 0,
    addonAmount: 0,
    noOfReEntries: 0,
    structure: blindLevelsNoAnte.map((e, i) => ({...e, id: 0, position: i})),
    name: 'Test',
    payout: 0,
    players: [],
    entries: [],
    eliminations: [],
    initialPricePool: 0,
    maxPlayers: 9,
    location: 1,
    password: '',
    locationName: 'Location Test',
    finishes: [],
    withAddon: true,
    withRebuy: true,
    withReEntry: false,
    rebuyStack: 1000,
    rankFormula: 0,
    liveTicker: [],
    temp: true
};
