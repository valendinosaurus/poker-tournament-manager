import { Component, Input } from '@angular/core';
import { SeriesTournament } from '../../models/combined-ranking.interface';

@Component({
    selector: 'app-series-tournament',
    templateUrl: './series-tournament.component.html',
    styleUrls: [
        './series-tournament.component.scss',
        '../../page/series-page/series-page.component.scss'
    ]
})
export class SeriesTournamentComponent {

    @Input() test: SeriesTournament | null;
    @Input() myEmail: string | undefined | null;

}
