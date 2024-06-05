import { Component, Input } from '@angular/core';
import { SimpleStat } from '../../../shared/models/simple-stat.interface';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { NgFor, DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-series-stats',
    templateUrl: './series-stats.component.html',
    styleUrls: [
        './series-stats.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgFor, UserImageRoundComponent, DecimalPipe]
})
export class SeriesStatsComponent {

    @Input() bestAverageRank: SimpleStat[];
    @Input() mostPrices: SimpleStat[];
    @Input() mostEffPrices: SimpleStat[];
    @Input() mostRebuysAddons: SimpleStat[];
    @Input() mostRebuysAddonsPerT: SimpleStat[];
    @Input() mostITM: SimpleStat[];
    @Input() mostPercITM: SimpleStat[];
    @Input() mostEliminations: SimpleStat[];
    @Input() mostSpilled: SimpleStat[];

}
