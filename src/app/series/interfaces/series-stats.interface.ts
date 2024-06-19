import { SimpleStat } from '../../shared/interfaces/simple-stat.interface';

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
    mostBubbles: SimpleStat[];
    biggestRivals: SimpleStat[];
}
