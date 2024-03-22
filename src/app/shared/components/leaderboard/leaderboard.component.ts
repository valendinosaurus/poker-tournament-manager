import { Component, Input } from '@angular/core';
import { OverallRanking } from '../../../series/models/overall-ranking.interface';
import { SeriesDetails } from '../../models/series-details.interface';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {

    @Input() overallRanking: OverallRanking[];
    @Input() series: SeriesDetails;
    @Input() full = true;

}
