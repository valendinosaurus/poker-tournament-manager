import { Component, DestroyRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { defer, iif, Observable, of, Subscription, timer } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { dummyTourney } from '../../../../shared/data/dummy-tournament.const';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionEventApiService } from '../../../../core/services/api/action-event-api.service';
import { ActionEvent } from '../../../../shared/models/action-event.interface';
import { FetchService } from '../../../../core/services/fetch.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { OverviewComponent } from '../overview/overview.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { SeriesMetadata } from '../../../../shared/models/series.interface';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    standalone: true,
    imports: [
        NgIf,
        OverviewComponent,
        AsyncPipe,
    ],
})
export class TimerComponent implements OnInit, OnChanges {

    @Input() config: {
        sub: string | undefined,
        password: string | undefined,
        tournamentId: number | undefined
    } | null;

    tournament$: Observable<Tournament>;
    seriesMetadata$: Observable<SeriesMetadata>;
    isSimpleTournament = false;
    isNotAllowed = false;
    clientId: number;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private router: Router = inject(Router);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);

    private fetchTrigger$: Observable<void>;

    private pullSubscription: Subscription;

    ngOnInit(): void {
        this.fetchTrigger$ = this.fetchService.getFetchTrigger$();
        this.clientId = Math.ceil(Math.random() * 100000);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.config) {
            if (!this.config?.tournamentId && !this.config?.password) {
                this.tournament$ = of(dummyTourney);
                this.isSimpleTournament = true;
            } else {
                if (this.config?.tournamentId) {

                    if (this.config.sub) {
                        this.getStuff(this.config?.tournamentId);

                        this.fetchService.trigger();

                        if (this.config?.tournamentId) {
                            const id = this.config.tournamentId;

                            this.eventApiService.deleteAll$(id).pipe(take(1)).subscribe();

                            this.pullSubscription = timer(5000, 4000).pipe(
                                takeUntilDestroyed(this.destroyRef),
                                switchMap(() => this.eventApiService.getAll$(id, this.clientId)),
                                tap((events: ActionEvent[]) => {
                                    if (events.length > 0 && +(events[0].tId) === +id) {
                                        //     console.log('*** LIVE *** : event triggered, fetch stuff');
                                        this.fetchService.trigger();
                                    }
                                }),
                                map((events: ActionEvent[]) => events.length ? ({
                                    shouldDelete: events.length > 0 && +(events[0].tId) === +id,
                                    eventId: events[0].id ?? -1
                                }) : {shouldDelete: false, eventId: -1}),
                                switchMap((deleteTrigger: { shouldDelete: boolean, eventId: number }) => iif(
                                    () => deleteTrigger.shouldDelete && +deleteTrigger.eventId > -1,
                                    defer(() => this.eventApiService.delete$(deleteTrigger.eventId)),
                                    of(null)
                                ))
                            ).subscribe();
                        }

                    } else {
                        this.isNotAllowed = true;
                        this.router.navigate(['admin']);
                    }
                }
            }
        }
    }

    getStuff(tournamentId: number): void {
        this.seriesMetadata$ = this.tournamentApiService.getSeriesMetadata$(+tournamentId);

        this.tournament$ = this.fetchTrigger$.pipe(
            switchMap(() => this.tournamentApiService.get$(+tournamentId)),
            //  tap(() => this.notificationService.success('Tournament is up to date')),
            shareReplay(1)
        );
    }
}
