import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SeriesS } from '../../shared/interfaces/series.interface';
import { CombinedEntriesFinishes } from '../../series/interfaces/combined-entries-finishes.interface';
import { SeriesTournament } from '../../series/interfaces/series-tournament.interface';
import { LeaderboardRow } from '../../series/interfaces/overall-ranking.interface';
import { Player } from '../../shared/interfaces/player.interface';

@Component({
    selector: 'app-player-stats',
    templateUrl: './player-stats.component.html',
    styleUrls: ['./player-stats.component.scss'],
    standalone: true
})
export class PlayerStatsComponent {

    private dialogRef: MatDialogRef<PlayerStatsComponent> = inject(MatDialogRef<PlayerStatsComponent>);
    data: {
        series: SeriesS;
        combined: CombinedEntriesFinishes[];
        combinedRankings: SeriesTournament[];
        overallRanking: LeaderboardRow[];
        player: Player;
    } = inject(MAT_DIALOG_DATA);

}
