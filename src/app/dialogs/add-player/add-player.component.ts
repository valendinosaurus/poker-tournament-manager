import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { Player } from '../../shared/models/player.interface';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { PlayerApiService } from '../../core/services/api/player-api.service';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { Tournament } from '../../shared/models/tournament.interface';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { FetchService } from '../../core/services/fetch.service';
import { ActionEventApiService } from '../../core/services/api/action-event-api.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { FinishApiService } from '../../core/services/api/finish-api.service';
import { Finish } from '../../shared/models/finish.interface';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';

@Component({
    selector: 'app-add-player',
    templateUrl: './add-player.component.html',
    styleUrls: ['./add-player.component.scss'],
    standalone: true,
    imports: [NgIf, FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgFor, UserImageRoundComponent]
})
export class AddPlayerComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number, tournamentId: number };
    modelMulti: { playerIds: number[] | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    data: {
        tournament: Tournament,
        multi: boolean,
        clientId: number
    } = inject(MAT_DIALOG_DATA);

    private dialogRef: MatDialogRef<AddPlayerComponent> = inject(MatDialogRef<AddPlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private notificationService: NotificationService = inject(NotificationService);

    allPlayers: { label: string, value: number }[];

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((players: Player[]) => {
                this.allPlayers = players
                    .filter(
                        player => !this.data.tournament.players.map(p => p.id).includes(player.id)
                    )
                    .map(
                        player => ({
                            label: player.name,
                            value: player.id
                        })
                    );

                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

    private initModel(): void {
        if (this.data.multi) {
            this.modelMulti = {
                playerIds: [],
                tournamentId: this.data.tournament.id
            };
        } else {
            this.model = {
                playerId: -1,
                tournamentId: this.data.tournament.id
            };
        }
    }

    private initFields(): void {
        if (this.data.multi) {
            this.fields = [
                this.formlyFieldService.getDefaultMultiSelectField('playerIds', 'Players', true, this.allPlayers)
            ];
        } else {
            this.fields = [
                this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
            ];
        }
    }

    isPlayerFinished(playerId: number): boolean {
        return this.data.tournament.finishes.map(f => f.playerId).includes(playerId);
    }

    hasPlayerEntered(playerId: number): boolean {
        return this.data.tournament.entries.map(e => e.playerId).includes(playerId);
    }

    onSubmit(model: { playerId: number, tournamentId: number }, withEntry: boolean): void {
        if (model.playerId > -1 && model.tournamentId) {
            // TODO improve
            if (withEntry) {
                this.tournamentApiService.addPlayer$(model.playerId, model.tournamentId).pipe(
                    take(1),
                    switchMap(
                        () => this.entryApiService.post$({
                            id: undefined,
                            playerId: model.playerId,
                            tournamentId: model.tournamentId,
                            type: EntryType.ENTRY,
                            timestamp: -1
                        }).pipe(
                            catchError(() => {
                                this.notificationService.error(`Error adding Player`);
                                return of(null);
                            }),
                            switchMap(() => this.finishApiService.increaseAllOfTournament$(
                                this.data.tournament.id,
                                this.data.tournament.finishes.map((finish: Finish) => finish.playerId)
                            )),
                            tap(() => {
                                this.notificationService.success('Player added');
                            }),
                            tap((a) => this.fetchService.trigger()),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournament.id,
                                clientId: this.data.clientId
                            })),
                            tap((result: any) => {
                                if (this.dialogRef) {
                                    this.dialogRef.close({
                                        entryId: result.id,
                                        playerId: model.playerId
                                    });
                                }
                            })
                        )
                    )
                ).subscribe();
            } else {
                this.tournamentApiService.addPlayer$(model.playerId, model.tournamentId).pipe(
                    take(1),
                    catchError(() => {
                        this.notificationService.error(`Error adding Player`);
                        return of(null);
                    }),
                    tap(() => {
                        this.notificationService.success('Player added');
                    }),
                    switchMap(() => this.finishApiService.increaseAllOfTournament$(
                        this.data.tournament.id,
                        this.data.tournament.finishes.map((finish: Finish) => finish.playerId)
                    )),
                    tap(() => this.fetchService.trigger()),
                    switchMap(() => this.eventApiService.post$({
                        id: null,
                        tId: this.data.tournament.id,
                        clientId: this.data.clientId
                    })),
                    tap(() => {
                        if (this.dialogRef) {
                            this.dialogRef.close({
                                playerId: model.playerId
                            });
                        }
                    })
                ).subscribe();
            }

        }
    }

    onSubmitMulti(model: { playerIds: number[] | undefined, tournamentId: number }, withEntry: boolean): void {
        if (model.playerIds && model.tournamentId) {
            this.tournamentApiService.addPlayers$(model.playerIds, model.tournamentId).pipe(
                take(1),
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            playerIds: model.playerIds
                        });
                    }
                })
            ).subscribe();
        }
    }

    removePlayer(playerId: number, playerName: string): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Remove Player',
                    body: `Do you really want to remove <strong>${playerName}</strong> from tournament <strong>${this.data.tournament.name}</strong>`,
                    confirm: 'Remove Player',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((result: boolean) => iif(
                    () => result,
                    defer(() => this.tournamentApiService.removePlayer$(playerId, this.data.tournament.id).pipe(
                        take(1),
                        catchError(() => {
                            this.notificationService.error('Error removing Player');
                            return of(null);
                        }),
                        tap(() => {
                            this.notificationService.success(`Player removed - ${playerName}`);
                        }),
                        switchMap(() => this.finishApiService.decreaseAllOfTournament$(
                            this.data.tournament.id,
                            this.data.tournament.finishes.map((finish: Finish) => finish.playerId)
                        )),
                        tap(() => this.fetchService.trigger()),
                        switchMap(() => this.eventApiService.post$({
                            id: null,
                            tId: this.data.tournament.id,
                            clientId: this.data.clientId
                        })),
                        tap(() => this.data.tournament.players = this.data.tournament.players.filter(
                            p => p.id !== playerId
                        )))
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

}
