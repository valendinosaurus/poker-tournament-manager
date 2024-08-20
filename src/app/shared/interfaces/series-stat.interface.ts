import { SimpleStat } from './simple-stat.interface';

export interface SeriesStat {
    stats: SimpleStat[];
    shouldUpdateLive: boolean;
}
