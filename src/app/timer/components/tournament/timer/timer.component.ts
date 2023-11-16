import { Component, DestroyRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { Player } from '../../../../shared/models/player.interface';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';
import { combineLatest, defer, iif, Observable, of, Subscription, timer } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { dummyTourney } from '../../../../shared/data/dummy-tournament.const';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventApiService } from '../../../../core/services/api/event-api.service';
import { ActionEvent } from '../../../../shared/models/event.interface';
import { FetchService } from '../../../../core/services/fetch.service';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
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
    randomId: number;

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

    private fetchTrigger$: Observable<void>;

    private pullSubscription: Subscription;

    ngOnInit(): void {
        this.fetchTrigger$ = this.fetchService.getFetchTrigger$();
        this.randomId = Math.ceil(Math.random() * 100000);
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
                                switchMap(() => this.eventApiService.getAll$(id, this.randomId, sub)),
                                tap((events: ActionEvent[]) => {
                                    if (events.length > 0 && +(events[0].tId) === +id) {
                                        console.log('*** LIVE *** : event triggered, fetch stuff');
                                        this.fetchService.trigger();
                                    } else {
                                        console.log('*** LIVE *** : nothing to do');
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

        const tourney$ = this.fetchTrigger$.pipe(
            switchMap(() => sub$.pipe(
                switchMap((sub: string) => this.tournamentApiService.get$(+tournamentId, sub)),
                shareReplay(1)
            ))
        );

        const blinds$ = this.fetchTrigger$.pipe(
            switchMap(() => sub$.pipe(
                switchMap((sub: string) => this.blindLevelApiService.getOfTournament$(+tournamentId, sub)),
                shareReplay(1)
            ))
        );

        const players$ = this.fetchTrigger$.pipe(
            switchMap(() => sub$.pipe(
                switchMap((sub: string) => this.playerApiService.getInTournament$(+tournamentId, sub)),
                shareReplay(1)
            ))
        );

        const entries$ = this.fetchTrigger$.pipe(
            switchMap(() => this.entryApiService.getInTournament$(+tournamentId)),
            shareReplay(1)
        );
        const finishes$ = this.fetchTrigger$.pipe(
            switchMap(() => this.finishApiService.getInTournament$(+tournamentId)),
            shareReplay(1)
        );

        this.seriesMetadata$ = sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.getSeriesMetadata$(+tournamentId, sub)),
        );

        this.tournament$ = this.fetchTrigger$.pipe(
            switchMap(() => combineLatest([
                tourney$,
                blinds$,
                players$,
                entries$,
                finishes$
            ]).pipe(
                tap(([tourney, blinds, players, entries, finishes]: [Tournament, BlindLevel[], Player[], Entry[], Finish[]]) => console.log('rebus', entries.length)),
                map(([tourney, blinds, players, entries, finishes]: [Tournament, BlindLevel[], Player[], Entry[], Finish[]]) => ({
                    ...tourney,
                    structure: blinds.sort((a, b) => (a.position) - (b.position)),
                    players: players,
                    entries: entries,
                    finishes: finishes
                }) as Tournament)
            ))
        );
    }
}
