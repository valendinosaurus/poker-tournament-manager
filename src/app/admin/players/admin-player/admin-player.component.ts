import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../../shared/interfaces/player.interface';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { User } from '@auth0/auth0-angular';
import { CreatePlayerComponent } from '../../../dialogs/create-player/create-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { ThatsMeDialogComponent } from '../../../welcome/components/dialogs/thats-me-dialog/thats-me-dialog.component';

@Component({
    selector: 'app-admin-player',
    standalone: true,
    imports: [CommonModule, AppHeaderComponent, RouterLink, MatButtonModule, MatTabsModule, UserImageRoundComponent],
    templateUrl: './admin-player.component.html'
})
export class AdminPlayerComponent implements OnInit {

    player$: Observable<Player>;
    user$: Observable<User>;
    sub$: Observable<string>;
    email$: Observable<string | undefined>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private router: Router = inject(Router);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();
        this.email$ = this.authUtilService.getEmail$();

        this.sId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.player$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) =>
                this.playerApiService.get$(sId)
            )
        );

        this.trigger$.next();
    }

    editPlayer(player: Player): void {
        const ref = this.dialog.open(CreatePlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: player,
                blockName: false
            }
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

    deletePlayer(player: Player): void {
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
                defer(() => this.playerApiService.delete$(player.id).pipe(
                    take(1),
                    tap(() => this.router.navigate(['/admin/player']))
                )),
                of(null)
            ))
        ).subscribe();
    }

    lock(player: Player): void {
        this.playerApiService.put$({
            ...player,
            locked: true
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(player: Player): void {
        this.playerApiService.put$({
            ...player,
            locked: false
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    thatsMe(player: Player): void {
        const dialogRef = this.dialog.open(ThatsMeDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: player,
                itsMe: true
            }
        });

        dialogRef.afterClosed().pipe(
            take(1),
            tap(res => {
                if (res) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    thatsNotMe(player: Player): void {
        const dialogRef = this.dialog.open(ThatsMeDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: player,
                itsMe: false
            }
        });

        dialogRef.afterClosed().pipe(
            take(1),
            tap(res => {
                if (res) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }
}
