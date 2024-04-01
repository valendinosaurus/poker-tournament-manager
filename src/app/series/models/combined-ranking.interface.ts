import { TournamentS } from '../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../shared/models/series.interface';
import { SeriesTournamentRow } from './combined-finish.interface';
import { Player } from '../../shared/models/player.interface';

export interface SeriesTournament {
    combFinishes: SeriesTournamentRow[];
    playersAlive: (Player & { rebuys: number, addons: number })[];
    tournament: TournamentS;
    seriesMetadata: SeriesMetadata;
    formulaText: string;
    pricePool: number;
    contribution: number;
}
