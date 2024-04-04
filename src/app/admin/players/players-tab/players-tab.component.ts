import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Player } from '../../../shared/models/player.interface';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { CreatePlayerComponent } from '../../../dialogs/create-player/create-player.component';

@Component({
    selector: 'app-players-tab',
    standalone: true,
    imports: [CommonModule, MatButtonModule, RouterLink, UserImageRoundComponent],
    templateUrl: './players-tab.component.html',
})
export class PlayersTabComponent implements OnInit {

    players$: Observable<Player[]>;

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.players$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.authUtilService.getSub$()),
            switchMap((sub: string) => this.playerApiService.getAll$(sub)),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    createPlayer(): void {
        const ref = this.dialog.open(CreatePlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
        });

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    deletePlayer(player: Player, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Player?',
                    body: `Do you really want to delete player <strong>${player.name}</strong>`,
                    confirm: 'Delete Player',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.authUtilService.getSub$().pipe(
                    switchMap((sub: string) => this.playerApiService.delete$(player.id, sub).pipe(
                        take(1),
                        tap(() => this.trigger$.next())
                    ))
                )),
                of(null)
            ))
        ).subscribe();
    }

}
