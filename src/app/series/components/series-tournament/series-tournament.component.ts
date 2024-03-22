import { Component, Input } from '@angular/core';
import { TournamentS } from '../../../shared/models/tournament.interface';
import { CombinedRanking } from '../../models/combined-ranking.interface';

@Component({
    selector: 'app-series-tournament',
    templateUrl: './series-tournament.component.html',
    styleUrls: [
        './series-tournament.component.scss',
        '../../page/series-page/series-page.component.scss'
    ]
})
export class SeriesTournamentComponent {

    @Input() tournament: TournamentS;
    @Input() combined: CombinedRanking[];
    @Input() i: number;

}
