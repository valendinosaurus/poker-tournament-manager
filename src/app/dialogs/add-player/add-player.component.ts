import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { Tournament } from '../../shared/interfaces/tournament.interface';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { FetchService } from '../../core/services/fetch.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { FinishApiService } from '../../core/services/api/finish-api.service';
import { Finish } from '../../shared/interfaces/finish.interface';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { TournamentService } from '../../core/services/util/tournament.service';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { AddPlayerModel } from './add-player-model.interface';
import { AddPlayerMultiModel } from './add-player-multi-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';

@Component({
    selector: 'app-add-player',
    templateUrl: './add-player.component.html',
    styleUrls: ['./add-player.component.scss'],
    standalone: true,
    imports: [NgIf, FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgFor, UserImageRoundComponent, MatFormFieldModule, MatOptionModule, MatSelectModule]
})
export class AddPlayerComponent extends BaseAddDialogComponent<AddPlayerComponent, AddPlayerModel> implements OnInit {

    tournament: WritableSignal<Tournament>;
    playersToAdd: Signal<{ label: string, value: number }[]>;

    modelMulti: AddPlayerMultiModel;

    data: {
        multi: boolean
    } = inject(MAT_DIALOG_DATA);

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private fetchService: FetchService = inject(FetchService);
    private tournamentService: TournamentService = inject(TournamentService);
    private notificationService: NotificationService = inject(NotificationService);
    private state: TimerStateService = inject(TimerStateService);

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.initModel();
        this.initSignals();
    }

    private initModel(): void {
        if (this.data.multi) {
            this.modelMulti = {
                playerIds: signal([]),
                isValid: computed(() => this.modelMulti.playerIds().length > 0)
            };
        } else {
            this.model = {
                playerId: signal(undefined),
                isValid: computed(() => this.model.playerId !== undefined)
            };
        }
    }

    private initSignals(): void {
        this.tournament = this.state.tournament;

        this.playersToAdd = computed(() => this.state.playersNotInTournament()
            .map(player => ({
                    label: player.name,
                    value: player.id
                })
            ).sort((a, b) =>
                a.label.localeCompare(b.label)
            )
        );
    }

    isPlayerFinished(playerId: number): boolean {
        return this.tournament().finishes.map(f => f.playerId).includes(playerId);
    }

    hasPlayerEntered(playerId: number): boolean {
        return this.tournament().entries.map(e => e.playerId).includes(playerId);
    }

    onSelectPlayersMulti(change: MatSelectChange): void {
        this.modelMulti.playerIds.set(change.value);
    }

    onSubmit(withEntry: boolean): void {
        const playerId = this.model.playerId();
        this.isLoadingAdd = true;

        if (playerId) {
            this.tournamentApiService.addPlayer$(playerId, this.tournament().id).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error(`Error adding Player`);
                    this.isLoadingAdd = false;
                    return of(null);
                }),
                switchMap(() => iif(
                    () => withEntry,
                    defer(() => this.entryApiService.post$({
                        id: undefined,
                        playerId: playerId,
                        tournamentId: this.tournament().id,
                        type: EntryType.ENTRY,
                        timestamp: -1
                    }).pipe(
                        catchError(() => {
                            this.notificationService.error(`Error entering Player`);
                            this.isLoadingAdd = false;
                            return of(null);
                        })
                    )),
                    of(null)
                )),
                switchMap(() => this.finishApiService.increaseAllOfTournament$(
                    this.tournament().id,
                    this.tournament().finishes.map((finish: Finish) => finish.playerId)
                )),
                tap((result: any) => {
                    this.fetchService.trigger();
                    this.isLoadingAdd = false;

                    if (this.dialogRef) {
                        this.dialogRef.close({
                            entryId: result.id,
                            playerId: playerId
                        });
                    }
                })
            ).subscribe();

        }
    }

    onSubmitMulti(withEntry: boolean): void {
        this.isLoadingAdd = true;

        if (this.modelMulti.playerIds().length > 0) {
            this.tournamentApiService.addPlayers$(this.modelMulti.playerIds(), this.tournament().id).pipe(
                take(1),
                tap(() => {
                    this.isLoadingAdd = false;

                    if (this.dialogRef) {
                        this.dialogRef.close({
                            playerIds: this.modelMulti.playerIds()
                        });
                    }
                })
            ).subscribe();
        }
    }

    removePlayer(playerId: number, playerName: string): void {
        this.isLoadingRemove = true;

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Remove Player',
                    body: `Do you really want to remove <strong>${playerName}</strong> from tournament <strong>${this.tournament().name}</strong>`,
                    confirm: 'Remove Player',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((result: boolean) => iif(
                    () => result,
                    defer(() => this.tournamentApiService.removePlayer$(playerId, this.tournament().id).pipe(
                        take(1),
                        catchError(() => {
                            this.notificationService.error('Error removing Player');
                            this.isLoadingRemove = false;
                            return of(null);
                        }),
                        switchMap(() => this.finishApiService.decreaseAllOfTournament$(
                            this.tournament().id,
                            this.tournament().finishes.map((finish: Finish) => finish.playerId)
                        )),
                        tap(() => {
                            this.fetchService.trigger();
                            this.isLoadingRemove = false;
                        }),
                        this.tournamentService.postActionEvent$,
                    )),
                    of(null)
                )
            )
        ).subscribe();
    }

}
