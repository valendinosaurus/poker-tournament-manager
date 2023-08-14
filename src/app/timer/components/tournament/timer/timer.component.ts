import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { Player } from '../../../../shared/models/player.interface';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';
import { combineLatest, Observable, of } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, shareReplay, switchMap } from 'rxjs/operators';
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

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnChanges {

    @Input() config: {
        sub: string | undefined,
        password: string | undefined,
        tournamentId: number | undefined
    } | null;

    tournament$: Observable<Tournament>;
    seriesMetadata$: Observable<SeriesMetadata>;
    playersInTheHole$: Observable<Player[]>;
    isSimpleTournament = false;
    isNotAllowed = false;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private authService: AuthService = inject(AuthService);
    private router: Router = inject(Router);

    ngOnChanges(changes: SimpleChanges): void {
        if (this.config) {
            if (!this.config?.tournamentId && !this.config?.password) {
                this.tournament$ = of(dummyTourney);
                this.isSimpleTournament = true;
            } else {
                if (this.config?.tournamentId) {

                    if (this.config.sub) {
                        this.getStuff(this.config?.tournamentId);
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

        const tourney$ = sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.get$(+tournamentId, sub)),
            shareReplay(1)
        );

        const blinds$ = sub$.pipe(
            switchMap((sub: string) => this.blindLevelApiService.getOfTournament$(+tournamentId, sub)),
            shareReplay(1)
        );

        const players$ = sub$.pipe(
            switchMap((sub: string) => this.playerApiService.getInTournament$(+tournamentId, sub)),
            shareReplay(1)
        );

        const entries$ = this.entryApiService.getInTournament$(+tournamentId).pipe(shareReplay(1));
        const finishes$ = this.finishApiService.getInTournament$(+tournamentId).pipe(shareReplay(1));

        this.seriesMetadata$ = sub$.pipe(
            switchMap((sub: string) => this.tournamentApiService.getSeriesMetadata$(+tournamentId, sub)),
        );

        const pureEntries$ = entries$.pipe(map((entries) => entries.filter(e => e.type === 'ENTRY')));

        this.playersInTheHole$ = combineLatest([
            players$,
            pureEntries$
        ]).pipe(
            map(([players, pureEntries]) => players.filter(p => !pureEntries.map(e => e.playerId).includes(p.id))),
        );

        this.tournament$ = combineLatest([
            tourney$,
            blinds$,
            players$,
            entries$,
            finishes$
        ]).pipe(
            map(([tourney, blinds, players, entries, finishes]: [Tournament, BlindLevel[], Player[], Entry[], Finish[]]) => ({
                ...tourney,
                structure: blinds.sort((a, b) => (a.position) - (b.position)),
                players: players,
                entries: entries,
                finishes: finishes
            }) as Tournament)
        );
    }
}
