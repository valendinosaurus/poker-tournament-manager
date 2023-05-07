import { BlindLevel } from './blind-level.interface';
import { Pause } from './pause.interface';
import { Player } from './player.interface';

export interface Tournamnet {
  id: number;
  name: string;
  date: Date;
  amountBuyIn: number;
  startStack: number;
  numberOfRebuys: number;
  amountRebuy: number;
  stackRebuy: number;
  numberOfAddons: number;
  amountAddon: number;
  stackAddon: number;
  structure: (BlindLevel | Pause)[];
  players: {
    player: Player;
    position: number;
    rebuys: number;
    addons: number;
  }[];
  payout: {
    place: number;
    percent: number;
  }[];
}
