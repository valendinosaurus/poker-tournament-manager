import { SimpleStat } from '../../shared/models/simple-stat.interface';

export interface SeriesStats {
    bestAverageRank: SimpleStat[];
    mostPrices: SimpleStat[];
    mostEffPrices: SimpleStat[];
    mostRebuysAddons: SimpleStat[];
    mostRebuysAddonsPerT: SimpleStat[];
    mostITM: SimpleStat[];
    mostPercITM: SimpleStat[];
    mostEliminations: SimpleStat[];
    mostSpilled: SimpleStat[];
}
