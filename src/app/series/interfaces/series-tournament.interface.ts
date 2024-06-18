import { TournamentS } from '../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../shared/interfaces/series.interface';
import { SeriesTournamentRow } from './series-tournament-row';
import { Player } from '../../shared/interfaces/player.interface';

export interface SeriesTournament {
    rows: SeriesTournamentRow[];
    playersAlive: (Player & { rebuys: number, addons: number })[];
    tournament: TournamentS;
    seriesMetadata: SeriesMetadata;
    formulaText: string;
    pricePool: number;
    contribution: number;
    withRebuy: boolean;
    withAddon: boolean;
    withReEntry: boolean;
    placesPaid: number;
}
