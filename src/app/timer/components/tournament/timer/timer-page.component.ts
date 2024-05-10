import { Component, inject, OnInit } from '@angular/core';
import { Tournament } from 'src/app/shared/models/tournament.interface';
import { Observable } from 'rxjs';
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
    private timerStateService: TimerStateService = inject(TimerStateService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private route: ActivatedRoute = inject(ActivatedRoute);

    private fetchTrigger$: Observable<void>;

    ngOnInit(): void {
        this.fetchTrigger$ = this.fetchService.getFetchTrigger$();
        this.timerStateService.clientId.set(Math.ceil(Math.random() * 100000));

        const tournamentId = +this.route.snapshot.params['tId'];

        this.fetchService.trigger();

        this.tournamentApiService.getSeriesMetadata$(tournamentId).pipe(
            take(1),
            tap((metadata) => this.timerStateService.metadata.set(metadata))
        ).subscribe();

        this.fetchTrigger$.pipe(
            switchMap(() => this.tournamentApiService.get$(tournamentId)),
            tap((tournament: Tournament) => {
                this.timerStateService.tournament.set(tournament);
                this.canShow = true;
            }),
            shareReplay(1)
        ).subscribe();

        this.playerApiService.getAll$().pipe(
            take(1),
            tap((players: Player[]) => {
                console.log('all', players);
                this.timerStateService.allAvailablePlayers.set(players);
            })
        ).subscribe();
    }

}
