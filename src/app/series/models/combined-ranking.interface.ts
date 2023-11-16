import { Tournament } from '../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { CombinedFinish } from './combined-finish.interface';
import { Player } from '../../shared/models/player.interface';

export interface CombinedRanking {
    combFinishes: CombinedFinish[];
    playersAlive: (Player & { rebuys: number, addons: number })[];
    tournament: Tournament;
    seriesMetadata: SeriesMetadata;
    formulaText: string;
    pricePool: number;
    contribution: number;
}
