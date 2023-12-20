import { Component, DestroyRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';
import { defer, iif, Observable, of, Subscription, timer } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { dummyTourney } from '../../../../shared/data/dummy-tournament.const';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventApiService } from '../../../../core/services/api/event-api.service';
import { ActionEvent } from '../../../../shared/models/event.interface';
import { FetchService } from '../../../../core/services/fetch.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
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
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private eventApiService: EventApiService = inject(EventApiService);
    private authService: AuthService = inject(AuthService);
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

                        if (this.config?.tournamentId && this.config.sub) {
                            const id = this.config.tournamentId;
                            const sub = this.config.sub;

                            this.eventApiService.deleteAll$(id).pipe(take(1)).subscribe();

                            this.pullSubscription = timer(5000, 4000).pipe(
                                takeUntilDestroyed(this.destroyRef),
                                switchMap(() => this.eventApiService.getAll$(id, this.clientId, sub)),
                                tap((events: ActionEvent[]) => {
                                    if (events.length > 0 && +(events[0].tId) === +id) {
                                        console.log('*** LIVE *** : event triggered, fetch stuff');
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
        const sub$ = this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? '')
        );

        this.seriesMetadata$ = sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.getSeriesMetadata$(+tournamentId, sub)),
        );

        this.tournament$ = this.fetchTrigger$.pipe(
            switchMap(() => sub$.pipe(
                    switchMap((sub: string) => this.tournamentApiService.get2$(+tournamentId, sub))
                ),
            ),
            tap(() => this.notificationService.success('Tournament is up to date')),
            shareReplay(1)
        );

        this.fetchTrigger$.pipe(
            switchMap(() => sub$.pipe(
                switchMap((sub: string) => this.tournamentApiService.get2$(+tournamentId, sub)),
                tap(console.log)
            ))
        ).subscribe();
    }
}
