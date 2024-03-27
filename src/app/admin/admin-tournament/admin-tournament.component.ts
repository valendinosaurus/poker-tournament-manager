import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { AuthUtilService } from '../../core/services/auth-util.service';
import { combineLatest, Observable } from 'rxjs';
import { Tournament } from '../../shared/models/tournament.interface';
import { filter, map, switchMap } from 'rxjs/operators';
import { TournamentDetails } from '../../shared/models/tournament-details.interface';
import {
    EditPlayersAndBlindsComponent
} from '../components/tournament/edit-players-and-blinds/edit-players-and-blinds.component';
import { DEFAULT_DIALOG_POSITION } from '../../core/const/app.const';
import { CreateTournamentComponent } from '../components/tournament/create-tournament/create-tournament.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-admin-tournament',
    templateUrl: './admin-tournament.component.html',
    styleUrls: ['./admin-tournament.component.scss']
})
export class AdminTournamentComponent implements OnInit {

    tournament$: Observable<Tournament>;
    sub$: Observable<string>;
    tId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);

        this.sub$ = this.authUtilService.getSub$();

        this.tId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.tournament$ = combineLatest([
            this.tId$,
            this.sub$
        ]).pipe(
            switchMap(([tId, sub]: [number, string]) => this.tournamentApiService.get2$(tId, sub))
        );

    }

    editBlindsAndPlayers(tournament: TournamentDetails): void {
        this.dialog.open(EditPlayersAndBlindsComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                tournament
            }
        });
    }

    editTournament(tournament: TournamentDetails): void {
        this.dialog.open(CreateTournamentComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                tournament
            }
        });
    }

}
