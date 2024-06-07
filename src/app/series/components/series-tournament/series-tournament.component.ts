import { Component, computed, DestroyRef, inject, input, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { SeriesTournament } from '../../models/combined-ranking.interface';
import { TEventTypeIconPipe } from '../../../shared/pipes/t-event-type-icon.pipe';
import { BulletsComponent } from '../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { TEvent } from '../../../shared/models/t-event.interface';
import { interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tournament } from '../../../shared/models/tournament.interface';
import { TimePipe } from '../../../shared/pipes/time.pipe';

@Component({
    selector: 'app-series-tournament',
    templateUrl: './series-tournament.component.html',
    styleUrls: [
        './series-tournament.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgIf, NgFor, UserImageRoundComponent, BulletsComponent, DecimalPipe, DatePipe, TEventTypeIconPipe, TimePipe]
})
export class SeriesTournamentComponent implements OnInit {

    tournament = input.required<SeriesTournament>();
    myEmail = input.required<string | undefined | null>();

    showEliminations: Signal<boolean> = computed(() =>
        this.tournament()?.combFinishes.filter(f => f.eliminations > 0).length > 0
    );

    liveTicker: WritableSignal<TEvent[]> = signal([]);

    fetchLiveTicker = computed(() =>
        new Date().getTime() - new Date(this.tournament().tournament.date).getTime() < 7 * 60 * 60 * 24 * 1000
    );

    isLiveTickerExpanded: WritableSignal<boolean>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.isLiveTickerExpanded = signal(this.fetchLiveTicker());

        this.liveTicker.set(this.tournament().tournament.liveTicker);

        if (this.fetchLiveTicker()) {
            interval(5000).pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => this.tournamentApiService.get$(this.tournament().tournament.id)),
                tap((tournament: Tournament) => {
                    this.liveTicker.set(tournament.liveTicker);
                })
            ).subscribe();
        }
    }

}
