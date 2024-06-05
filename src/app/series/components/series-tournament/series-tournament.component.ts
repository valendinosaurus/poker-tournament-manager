import { Component, computed, input, Signal } from '@angular/core';
import { SeriesTournament } from '../../models/combined-ranking.interface';
import { TEventTypeIconPipe } from '../../../shared/pipes/t-event-type-icon.pipe';
import { BulletsComponent } from '../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';

@Component({
    selector: 'app-series-tournament',
    templateUrl: './series-tournament.component.html',
    styleUrls: [
        './series-tournament.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgIf, NgFor, UserImageRoundComponent, BulletsComponent, DecimalPipe, DatePipe, TEventTypeIconPipe]
})
export class SeriesTournamentComponent {

    tournament = input.required<SeriesTournament>();
    myEmail = input.required<string | undefined | null>();

    showEliminations: Signal<boolean> = computed(() =>
        this.tournament()?.combFinishes.filter(f => f.eliminations > 0).length > 0
    );

    isLiveTickerExpanded = true;

}
