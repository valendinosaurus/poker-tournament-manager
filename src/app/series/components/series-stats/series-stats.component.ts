import { AfterViewInit, Component, ElementRef, input, signal, ViewChild, WritableSignal } from '@angular/core';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { DecimalPipe } from '@angular/common';
import { SeriesStatComponent } from './series-stat/series-stat.component';
import { Series } from '../../../shared/interfaces/series.interface';
import KeenSlider, { KeenSliderInstance } from 'keen-slider';
import { SeriesStat } from '../../../shared/interfaces/series-stat.interface';

@Component({
    selector: 'app-series-stats',
    templateUrl: './series-stats.component.html',
    styleUrls: [
        './series-stats.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [
        UserImageRoundComponent,
        DecimalPipe,
        SeriesStatComponent
    ]
})
export class SeriesStatsComponent implements AfterViewInit {

    series = input.required<Series>();
    bestAverageRank = input.required<SeriesStat>();
    mostPrices = input.required<SeriesStat>();
    mostEffPrices = input.required<SeriesStat>();
    mostRebuysAddons = input.required<SeriesStat>();
    mostRebuysAddonsPerT = input.required<SeriesStat>();
    mostITM = input.required<SeriesStat>();
    mostPercITM = input.required<SeriesStat>();
    mostBounties = input.required<SeriesStat>();
    mostEliminations = input.required<SeriesStat>();
    mostBubbles = input.required<SeriesStat>();
    biggestRivals = input.required<SeriesStat>();
    mostSpilled = input.required<SeriesStat>();
    hasRebuy = input.required<boolean>();
    hasAddon = input.required<boolean>();
    hasBounty = input.required<boolean>();
    isAnyTournamentRunning = input.required<boolean>();

    slider: KeenSliderInstance;
    currentSlide: WritableSignal<number> = signal(0);

    @ViewChild('sliderRef') sliderRef: ElementRef<HTMLElement>;

    ngAfterViewInit(): void {
        this.slider = new KeenSlider(this.sliderRef.nativeElement, {
            loop: true,
            initial: this.currentSlide(),
            slideChanged: (s: any) => {
                this.currentSlide.set(s.track.details.rel);
            }
        });
    }

}
