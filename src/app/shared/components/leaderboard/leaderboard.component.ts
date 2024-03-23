import { Component, inject, Input } from '@angular/core';
import { LeaderboardRow } from '../../../series/models/overall-ranking.interface';
import { SeriesDetails, SeriesDetailsS } from '../../models/series-details.interface';
import { Dialog } from '@angular/cdk/dialog';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {

    @Input() leaderboard: LeaderboardRow[] | null;
    @Input() series: SeriesDetails | SeriesDetailsS | null;
    @Input() full = true;

    dialogPosition = {
        position: {
            top: '40px'
        },
        maxHeight: '90vh'
    };

    private dialog: Dialog = inject(Dialog);

}
