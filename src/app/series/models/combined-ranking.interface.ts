import { Tournament } from '../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { CombinedFinish } from './combined-finish.interface';

export interface CombinedRanking {
    combFinishes: CombinedFinish[];
    tournament: Tournament;
    seriesMetadata: SeriesMetadata;
    formulaText: string;
    pricePool: number;
    contribution: number;
}
