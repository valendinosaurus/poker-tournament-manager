import { Component, input, Input } from '@angular/core';
import { SimpleStat } from '../../../shared/interfaces/simple-stat.interface';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { NgFor, DecimalPipe } from '@angular/common';
import { SeriesStatComponent } from './series-stat/series-stat.component';

@Component({
    selector: 'app-series-stats',
    templateUrl: './series-stats.component.html',
    styleUrls: [
        './series-stats.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgFor, UserImageRoundComponent, DecimalPipe, SeriesStatComponent]
})
export class SeriesStatsComponent {

    bestAverageRank = input.required<SimpleStat[]>();
    mostPrices = input.required<SimpleStat[]>();
    mostEffPrices = input.required<SimpleStat[]>();
    mostRebuysAddons = input.required<SimpleStat[]>();
    mostRebuysAddonsPerT = input.required<SimpleStat[]>();
    mostITM = input.required<SimpleStat[]>();
    mostPercITM = input.required<SimpleStat[]>();
    mostEliminations = input.required<SimpleStat[]>();
    mostSpilled = input.required<SimpleStat[]>();

}
