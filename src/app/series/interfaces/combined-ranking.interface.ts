import { TournamentS } from '../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../shared/interfaces/series.interface';
import { SeriesTournamentRow } from './combined-finish.interface';
import { Player } from '../../shared/interfaces/player.interface';

export interface SeriesTournament {
    combFinishes: SeriesTournamentRow[];
    playersAlive: (Player & { rebuys: number, addons: number })[];
    tournament: TournamentS;
    seriesMetadata: SeriesMetadata;
    formulaText: string;
    pricePool: number;
    contribution: number;
}
