import { Component, computed, DestroyRef, inject, OnInit, signal, Signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../core/services/fetch.service';
import { ConductedEntry } from '../../shared/models/util/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, Observable, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { TournamentService } from '../../core/services/util/tournament.service';
import { EliminationApiService } from '../../core/services/api/elimination-api.service';
import { ServerResponse } from '../../shared/models/server-response';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { AddRebuyModel } from './add-rebuy-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-add-rebuy',
    templateUrl: './add-rebuy.component.html',
    styleUrls: ['./add-rebuy.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, JsonPipe, MatFormFieldModule, MatOptionModule, MatSelectModule]
})
export class AddRebuyComponent implements OnInit {

    playersToRebuy: Signal<{ label: string, value: number }[]>;
    eliminators: Signal<{ label: string, value: number }[]>;
    conductedRebuys: Signal<ConductedEntry[]>;

    model: AddRebuyModel;

    private dialogRef: MatDialogRef<AddRebuyComponent> = inject(MatDialogRef<AddRebuyComponent>);

    private tournamentService: TournamentService = inject(TournamentService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private fetchService: FetchService = inject(FetchService);
    private eliminationApiService: EliminationApiService = inject(EliminationApiService);
    private notificationService: NotificationService = inject(NotificationService);
    private tEventApiService: TEventApiService = inject(TEventApiService);
    private timerStateService: TimerStateService = inject(TimerStateService);

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.initModel();
        this.initSignals();
    }

    private initModel(): void {
        this.model = {
            playerId: signal(undefined),
            eliminatedBy: signal(undefined),
            isValid: computed(() =>
                this.model.playerId() !== undefined
                && this.model.eliminatedBy() !== undefined
                && this.model.playerId() !== this.model.eliminatedBy()
            )
        };
    }

    private initSignals(): void {
        this.playersToRebuy = computed(() => this.timerStateService.eligibleForRebuy().map(
            player => ({
                label: player.name,
                value: player.id
            })
        ));

        this.conductedRebuys = this.timerStateService.conductedRebuys;
        this.eliminators = computed(() =>
            this.playersToRebuy().filter(p => p.value !== this.model.playerId())
        );
    }

    onSubmit(): void {
        const playerId = this.model.playerId();
        const eliminatedById = this.model.eliminatedBy();

        if (playerId && eliminatedById) {
            this.entryApiService.post$({
                id: undefined,
                playerId: playerId,
                tournamentId: this.timerStateService.tournament().id,
                type: EntryType.REBUY,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error(`Error adding Rebuy`);
                    return of(null);
                }),
                switchMap((res: ServerResponse | null) =>
                    this.postElimination$(eliminatedById, playerId, this.timerStateService.tournament().id, res?.id)
                ),
                switchMap(() => this.postRebuyTEvent$(playerId, eliminatedById)),
                tap((a) => this.fetchService.trigger()),
                this.tournamentService.postActionEvent$,
            ).subscribe();
        }
    }

    private postElimination$(eById: number, pId: number, tId: number, resId: string | undefined): Observable<ServerResponse | null> {
        return this.eliminationApiService.post$({
            eliminator: eById,
            eliminated: pId,
            tournamentId: tId,
            timestamp: -1,
            eId: `R-${resId}`
        }).pipe(
            catchError(() => {
                this.notificationService.error('Error Elimination');
                return of(null);
            }),
        );
    }

    private postRebuyTEvent$(pId: number, eById: number): Observable<ServerResponse | null> {
        const eliminated = this.playersToRebuy().filter(e => e.value === pId)[0].label;
        const eliminator = this.playersToRebuy().filter(e => e.value === eById)[0].label;
        const message = `Rebuy for <strong>${eliminated}</strong>, who was kicked out by ${eliminator}!`;

        return this.tEventApiService.post$(this.timerStateService.tournament().id, message, TEventType.REBUY);
    }

    deleteRebuy(entryId: number, playerName: string): void {
        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Rebuy',
                        body: `Do you really want to remove the rebuy of <strong>${playerName}</strong> from tournament <strong>${this.timerStateService.tournament().name}</strong>`,
                        confirm: 'Remove Rebuy',
                        isDelete: true
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
                            switchMap(() => this.eliminationApiService.deleteByEId$(
                                `R-${entryId}`
                            ).pipe(
                                catchError(() => {
                                    this.notificationService.error('Error removing Elimination');
                                    return of(null);
                                })
                            )),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.timerStateService.tournament().id,
                                    `<strong>${playerName}</strong> cancelled his Rebuy!`,
                                    TEventType.CORRECTION
                                );
                            }),
                            tap((a) => this.fetchService.trigger()),
                            this.tournamentService.postActionEvent$,
                        )),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();

        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }

}
