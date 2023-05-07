import { Tournamnet } from '../models/tournament.interface';
import { blindLevelsNoAnte } from './blind-levels.const';

export const dummyTourney: Tournamnet = {
  id: 1,
  date: new Date(),
  amountBuyIn: 50,
  startStack: 10000,
  numberOfRebuys: 0,
  amountRebuy: 0,
  stackRebuy: 10000,
  numberOfAddons: 0,
  amountAddon: 0,
  stackAddon: 25000,
  structure: blindLevelsNoAnte,
  name: 'Test',
  payout: [
    {
      place: 1,
      percent: 50,
    },

    {
      place: 2,
      percent: 30,
    },

    {
      place: 3,
      percent: 20,
    },
  ],
  players: [
    {
      player: {
        id: 0,
        name: 'Vale',
      },
      addons: 0,
      rebuys: 0,
      position: 0,
    },
    {
      player: {
        id: 0,
        name: 'Diana',
      },
      addons: 0,
      rebuys: 0,
      position: 0,
    },
    {
      player: {
        id: 0,
        name: 'Mario',
      },
      addons: 0,
      rebuys: 0,
      position: 0,
    },
  ],
};
