import { Component, inject, OnInit } from '@angular/core';
import { Tournament } from 'src/app/shared/interfaces/tournament.interface';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../shared/services/api/tournament-api.service';
import { ActivatedRoute } from '@angular/router';
import { FetchService } from '../../../../shared/services/fetch.service';
import { OverviewComponent } from '../overview/overview.component';
import { AsyncPipe } from '@angular/common';
import { TimerStateService } from '../../../services/timer-state.service';
import { MatDialogModule } from '@angular/material/dialog';
import { PlayerApiService } from '../../../../shared/services/api/player-api.service';
import { Player } from '../../../../shared/interfaces/player.interface';
import { AuthUtilService } from '../../../../shared/services/auth-util.service';
import { TimerkMode } from '../../../../shared/enums/timer-mode.enum';
import { TableDrawService } from '../../../../table-draw/services/table-draw.service';
import { TableDraw } from '../../../../table-draw/interfaces/table-draw.interface';
import { TableDrawStep } from '../../../../table-draw/enums/table-draw-step.enum';

@Component({
    selector: 'app-timer-page',
    templateUrl: './timer-page.component.html',
    standalone: true,
    imports: [
        OverviewComponent,
        AsyncPipe,
        MatDialogModule
    ],

})
export class TimerPageComponent implements OnInit {

    isNotAllowed = false;
    canShow = false;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);
    private state: TimerStateService = inject(TimerStateService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private route: ActivatedRoute = inject(ActivatedRoute);
    private tableDrawService: TableDrawService = inject(TableDrawService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    private fetchTrigger$: Observable<void>;

    ngOnInit(): void {
        this.state.timerMode.set(this.route.snapshot.data['mode'] || 'FULL');

        this.fetchTrigger$ = this.fetchService.getFetchTrigger$();
        this.state.clientId.set(Math.ceil(Math.random() * 100000));
        const tournamentId = +this.route.snapshot.params['tId'];

        if (this.state.timerMode() === TimerkMode.CLOCK) {
            this.tableDrawService.persistDrawToDb.set(false);
            this.tableDrawService.id.set(tournamentId);
        }

        this.fetchService.trigger(true);

        combineLatest([
            this.authUtilService.isPro$(),
            this.authUtilService.isAdmin$()
        ]).pipe(
            take(1),
            tap(([isPro, isAdmin]: [boolean, boolean]) => {
                this.state.isProOrAdmin.set(isPro || isAdmin);
            })
        ).subscribe();

        this.tournamentApiService.getSeriesMetadata$(tournamentId).pipe(
            take(1),
            tap((metadata) => this.state.metadata.set(metadata))
        ).subscribe();

        this.fetchTrigger$.pipe(
            switchMap(() => this.tournamentApiService.get$(tournamentId)),
            tap((tournament: Tournament) => {
                this.state.tournament.set(tournament);

                this.canShow = true;
                this.state.blockPut.set(false);

                if (this.state.markForReset()) {
                    this.fetchService.triggerReset();
                }
            }),
            switchMap(() => this.tournamentApiService.getTableDraw$(tournamentId)),
            tap((tableDraw: TableDraw | null) => {
                if (this.state.timerMode() !== 'CLOCK') {
                    this.tableDrawService.minTables.set(this.state.tournament().minTables);
                    this.tableDrawService.maxTables.set(this.state.tournament().maxTables);
                    this.tableDrawService.maxPlayersPerTable.set(this.state.tournament().maxPlayersPerTable);

                    this.tableDrawService.tableDraw.set(
                        tableDraw
                            ? {
                                ...tableDraw,
                                players: tableDraw.step === TableDrawStep.DRAWN
                                    ? this.state.players()
                                    : this.state.players().filter(
                                        p => !this.state.finishes().map(f => f.playerId).includes(p.id)
                                    ),
                                finishedPlayerIds: this.state.finishes().map(f => f.playerId)
                            }
                            : undefined
                    );

                    if (tableDraw?.step === TableDrawStep.BLANK) {
                        this.tableDrawService.setupEmptyTables(this.state.tournamentId());
                    } else {

                        this.tableDrawService.update(this.state.tournamentId());
                    }
                }
            }),
            shareReplay(1)
        ).subscribe();

        this.playerApiService.getAll$().pipe(
            take(1),
            tap((players: Player[]) => {
                this.state.allAvailablePlayers.set(players);
            })
        ).subscribe();

    }

}
