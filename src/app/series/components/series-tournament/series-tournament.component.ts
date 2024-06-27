import { Component, computed, DestroyRef, inject, input, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { SeriesTournament } from '../../interfaces/series-tournament.interface';
import { TEventTypeIconPipe } from '../../../shared/pipes/t-event-type-icon.pipe';
import { BulletsComponent } from '../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TEvent } from '../../../shared/interfaces/t-event.interface';
import { interval, Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../../shared/pipes/time.pipe';
import { TEventApiService } from '../../../shared/services/api/t-event-api.service';
import { Series } from '../../../shared/interfaces/series.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';
import { Entry } from 'src/app/shared/interfaces/entry.interface';
import { UserWithImageComponent } from '../../../shared/components/user-with-image/user-with-image.component';

@Component({
    selector: 'app-series-tournament',
    templateUrl: './series-tournament.component.html',
    styleUrls: [
        './series-tournament.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgIf, NgFor, UserImageRoundComponent, BulletsComponent, DecimalPipe, DatePipe, TEventTypeIconPipe, TimePipe, AsyncPipe, UserWithImageComponent]
})
export class SeriesTournamentComponent implements OnInit {

    series = input.required<Series>();
    tournament = input.required<SeriesTournament>();
    myEmail = input.required<string | undefined | null>();
    password = input.required<string>();

    finishesToShow = computed(() =>
        this.series().showNonItmPlaces
            ? this.tournament().rows
            : this.tournament().rows.filter(finish => finish.price > 0)
    );

    liveTicker: WritableSignal<TEvent[]> = signal([]);

    fetchLiveTicker = computed(() =>
        new Date().getTime() - new Date(this.tournament().tournament.date).getTime() < 60 * 60 * 24 * 1000
    );

    isLiveTickerExpanded: WritableSignal<boolean>;

    isPayoutAdapted = computed(() => this.tournament().isPayoutsAdapted);

    bountyPool = computed(() =>
        this.tournament().tournament.bountyAmount
        * this.tournament().tournament.entries.filter((e: Entry) => e.type !== EntryType.ADDON).length
    );

    refreshTrigger$: Observable<number>;
    countdown$: Observable<number>;

    private destroyRef: DestroyRef = inject(DestroyRef);
    private tEventApiService: TEventApiService = inject(TEventApiService);

    ngOnInit(): void {
        this.isLiveTickerExpanded = signal(this.fetchLiveTicker());

        this.liveTicker.set(this.tournament().tournament.liveTicker);

        if (this.fetchLiveTicker() && this.series().showLiveTicker) {
            this.refreshTrigger$ = interval(50).pipe(shareReplay(1));

            this.countdown$ = this.refreshTrigger$.pipe(
                map((n: number) => 400 - (n % 400))
            );

            this.refreshTrigger$.pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(n => n % 400 === 0),
                switchMap((a: number) => this.tEventApiService.getAll$(
                        this.tournament().tournament.id,
                    ).pipe(
                        tap((liveTicker: TEvent[]) => {
                            this.liveTicker.set(liveTicker);
                        })
                    ),
                )
            ).subscribe();
        }
    }

}
