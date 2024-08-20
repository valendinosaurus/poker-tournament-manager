import { SeriesStat } from '../../shared/interfaces/series-stat.interface';

export interface SeriesStats {
    bestAverageRank: SeriesStat;
    mostPrices: SeriesStat;
    mostEffPrices: SeriesStat;
    mostRebuysAddons: SeriesStat;
    mostRebuysAddonsPerT: SeriesStat;
    mostITM: SeriesStat;
    mostPercITM: SeriesStat;
    mostEliminations: SeriesStat;
    mostSpilled: SeriesStat;
    mostBubbles: SeriesStat;
    mostBounties: SeriesStat;
    biggestRivals: SeriesStat;
}
