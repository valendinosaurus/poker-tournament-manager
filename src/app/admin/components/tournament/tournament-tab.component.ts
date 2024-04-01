import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateTournamentComponent } from './create-tournament/create-tournament.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AdminTournament } from '../../../shared/models/tournament.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tournament-tab',
    templateUrl: './tournament-tab.component.html',
    styleUrls: ['./tournament-tab.component.scss'],
    standalone: true,
    imports: [MatButtonModule, NgFor, RouterLink, NgIf, AsyncPipe, DatePipe]
})
export class TournamentTabComponent implements OnInit {

    tournaments$: Observable<AdminTournament[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private router: Router = inject(Router);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.tournaments$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.authUtilService.getSub$()),
            switchMap((sub: string) => this.tournamentApiService.getForAdmin$(sub)),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    reload(): void {
        this.trigger$.next();
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
