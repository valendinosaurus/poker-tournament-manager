import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { AdminTournament } from '../../../shared/models/tournament-details.interface';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { TriggerService } from '../../../core/services/util/trigger.service';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateTournamentComponent } from './create-tournament/create-tournament.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';

@Component({
    selector: 'app-tournament-tab',
    templateUrl: './tournament-tab.component.html',
    styleUrls: ['./tournament-tab.component.scss']
})
export class TournamentTabComponent implements OnInit {

    tournaments$: Observable<AdminTournament[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private router: Router = inject(Router);
    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.tournaments$ = combineLatest([
            this.triggerService.getTournamentsTrigger$(),
            this.authUtilService.getSub$()
        ]).pipe(
            map(([_trigger, sub]: [void, string]) => sub),
            switchMap((sub: string) => this.tournamentApiService.getForAdmin$(sub)),
            shareReplay(1)
        );
    }

    reload(): void {
        this.triggerService.triggerTournaments();
    }

    deleteTournament(tId: number): void {
        this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.tournamentApiService.delete$(tId, sub).pipe(
                take(1),
                tap(() => this.reload())
            ))
        ).subscribe();
    }

    openTournament(tId: number): void {
        const link = this.router.serializeUrl(this.router.createUrlTree(['timer', tId]));
        window.open(link, '_blank');
    }

    createTournament(): void {
        this.dialog.open(CreateTournamentComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
        });
    }
}
