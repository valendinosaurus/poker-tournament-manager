import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../shared/models/player.interface';
import { FetchService } from '../../core/services/fetch.service';
import { ActionEventApiService } from '../../core/services/api/action-event-api.service';
import { ConductedEntry } from '../../shared/models/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { TournamentService } from '../../core/services/util/tournament.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tournament } from '../../shared/models/tournament.interface';
import { EliminationApiService } from '../../core/services/api/elimination-api.service';
import { ServerResponse } from '../../shared/models/server-response';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';

@Component({
    selector: 'app-add-rebuy',
    templateUrl: './add-rebuy.component.html',
    styleUrls: ['./add-rebuy.component.scss']
})
export class AddRebuyComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: {
        playerId: number | undefined,
        tournamentId: number,
        eliminatedBy: number | undefined,
        showEliminatedBy: boolean
    };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddRebuyComponent> = inject(MatDialogRef<AddRebuyComponent>);

    data: {
        tournamentId: number,
        tournamentName: string,
        clientId: number,
        sub: string
    } = inject(MAT_DIALOG_DATA);

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private tournamentService: TournamentService = inject(TournamentService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private eliminationApiService: EliminationApiService = inject(EliminationApiService);
    private notificationService: NotificationService = inject(NotificationService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private tEventApiService: TEventApiService = inject(TEventApiService);

    allPlayers: { label: string, value: number }[];
    eliminators: { label: string, value: number }[];
    eligibleForRebuy: Player[];
    conductedRebuys: ConductedEntry[];

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.fetchService.getFetchTrigger$().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.tournamentApiService.get2$(this.data.tournamentId, this.data.sub)),
            tap((tournament: Tournament) => {
                this.eligibleForRebuy = this.tournamentService.getPlayersEligibleForRebuy(tournament);
                this.allPlayers = this.eligibleForRebuy.map(
                    player => ({
                        label: player.name,
                        value: player.id
                    })
                );

                this.conductedRebuys = this.tournamentService.getConductedRebuys(tournament);

                this.initModel();
                this.initFields();
            })
        ).subscribe();

        this.fetchService.trigger();
    }

    private initModel(): void {
        this.model = {
            playerId: undefined,
            tournamentId: this.data.tournamentId,
            showEliminatedBy: false,
            eliminatedBy: undefined
        };
    }

    private initFields(): void {
        this.eliminators = [...this.allPlayers];

        this.fields = [
            {
                ...this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers),
                expressions: {
                    change: () => this.eliminators = [...this.allPlayers.filter(p => p.value !== this.model.playerId)]
                }
            },
            {
                key: 'showEliminatedBy',
                type: 'checkbox',
                props: {
                    label: 'Show Eliminated by?'
                }
            },
            {
                ...this.formlyFieldService.getDefaultSelectField('eliminatedBy', 'Eliminator', false, this.eliminators),
                expressions: {
                    hide: () => !this.model.showEliminatedBy,
                    'props.options': () => this.eliminators,
                    'props.disabled': () => this.model.playerId === undefined
                }
            }
        ];
    }

    onSubmit(model: { playerId: number | undefined, tournamentId: number, eliminatedBy: number | undefined }): void {
        if (model.playerId && model.tournamentId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: model.playerId,
                tournamentId: model.tournamentId,
                type: EntryType.REBUY,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error(`Error adding Rebuy`);
                    return of(null);
                }),
                tap((e) => {
                    const playerName = this.eligibleForRebuy.filter(e => e.id === model.playerId)[0].name;
                    this.notificationService.success(`Rebuy - ${playerName}`);
                }),
                switchMap((res: ServerResponse | null) => iif(
                    () => !!model.eliminatedBy,
                    defer(() =>
                        model.playerId && model.eliminatedBy
                            ? this.eliminationApiService.post$({
                                eliminator: model.eliminatedBy,
                                eliminated: model.playerId,
                                tournamentId: model.tournamentId,
                                timestamp: -1,
                                eId: `R-${res?.id}`
                            }).pipe(
                                tap(() => {
                                    if (model.eliminatedBy) {
                                        console.log(model.eliminatedBy);
                                        const eliminator = this.allPlayers.filter(e => e.value === model.eliminatedBy)[0].label;
                                        const eliminated = this.allPlayers.filter(e => e.value === model.playerId)[0].label;
                                        this.notificationService.success(`${eliminator} kicked out ${eliminated}`);
                                    }
                                }),
                                catchError(() => {
                                    this.notificationService.error('Error Elimination');
                                    return of(null);
                                }),
                            )
                            : of(null)
                    ),
                    of(null)
                )),
                switchMap(() => {
                    const eliminated = this.allPlayers.filter(e => e.value === model.playerId)[0].label;

                    let message = `Rebuy for <strong>${eliminated}</strong>`;

                    if (!!model.eliminatedBy) {
                        const eliminator = this.allPlayers.filter(e => e.value === model.eliminatedBy)[0].label;
                        message +=
                            `, who was kicked out by ${eliminator}!`;
                    }

                    return this.tEventApiService.post$(this.data.tournamentId, message, TEventType.REBUY);
                }),
                tap((a) => this.fetchService.trigger()),
                switchMap(() => this.eventApiService.post$({
                    id: null,
                    tId: this.data.tournamentId,
                    clientId: this.data.clientId
                })),
            ).subscribe();

        }
    }

    deleteRebuy(entryId: number, playerName: string): void {
        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Rebuy',
                        body: `Do you really want to remove the rebuy of <strong>${playerName}</strong> from tournament <strong>${this.data.tournamentName}</strong>`,
                        confirm: 'Remove Rebuy'
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.entryApiService.delete$(entryId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Rebuy');
                                return of(null);
                            }),
                            tap(() => {
                                this.notificationService.success(`Rebuy removed - ${playerName}`);
                            }),
                            switchMap(() => this.eliminationApiService.deleteByEId$(
                                `R-${entryId}`
                            ).pipe(
                                tap(() => {
                                    this.notificationService.success(`Elimination removed`);
                                }),
                                catchError(() => {
                                    this.notificationService.error('Error removing Elimination');
                                    return of(null);
                                })
                            )),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.data.tournamentId,
                                    `<strong>${playerName}</strong> cancelled his Rebuy!`,
                                    TEventType.CORRECTION
                                );
                            }),
                            tap((a) => this.fetchService.trigger()),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournamentId,
                                clientId: this.data.clientId
                            })),
                        )),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

    closeDialog(): void {
        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }

}
