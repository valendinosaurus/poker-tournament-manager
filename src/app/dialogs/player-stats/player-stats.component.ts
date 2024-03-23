import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SeriesDetailsS } from '../../shared/models/series-details.interface';
import { CombinedEntriesFinishes } from '../../series/models/combined-entries-finishes.interface';
import { SeriesTournament } from '../../series/models/combined-ranking.interface';
import { LeaderboardRow } from '../../series/models/overall-ranking.interface';
import { Player } from '../../shared/models/player.interface';

@Component({
    selector: 'app-player-stats',
    templateUrl: './player-stats.component.html',
    styleUrls: ['./player-stats.component.scss']
})
export class PlayerStatsComponent {

    private dialogRef: MatDialogRef<PlayerStatsComponent> = inject(MatDialogRef<PlayerStatsComponent>);
    data: {
        series: SeriesDetailsS;
        combined: CombinedEntriesFinishes[];
        combinedRankings: SeriesTournament[];
        overallRanking: LeaderboardRow[];
        player: Player;
    } = inject(MAT_DIALOG_DATA);

}
