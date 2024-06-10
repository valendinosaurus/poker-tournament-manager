import { Component, inject, OnInit } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { ActivatedRoute } from '@angular/router';
import { FetchService } from '../../../../core/services/fetch.service';
import { OverviewComponent } from '../overview/overview.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { TimerStateService } from '../../../services/timer-state.service';
import { MatDialogModule } from '@angular/material/dialog';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { Player } from '../../../../shared/models/player.interface';
import { TableDrawService } from '../../../../core/services/table-draw.service';
import { AuthUtilService } from '../../../../core/services/auth-util.service';

@Component({
    selector: 'app-timer-page',
    templateUrl: './timer-page.component.html',
    standalone: true,
    imports: [
        NgIf,
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
        this.fetchTrigger$ = this.fetchService.getFetchTrigger$();
        this.state.clientId.set(Math.ceil(Math.random() * 100000));
        const tournamentId = +this.route.snapshot.params['tId'];
        this.fetchService.trigger();

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
                this.tableDrawService.update();
                this.canShow = true;
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
