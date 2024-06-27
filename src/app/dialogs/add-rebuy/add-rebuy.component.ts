import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../shared/services/fetch.service';
import { ConductedEntry } from '../../shared/interfaces/util/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../shared/services/notification.service';
import { TournamentService } from '../../shared/services/util/tournament.service';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { AddRebuyModel } from './add-rebuy-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { TimerApiService } from '../../shared/services/api/timer-api.service';
import { UserWithImageComponent } from '../../shared/components/user-with-image/user-with-image.component';

@Component({
    selector: 'app-add-rebuy',
    templateUrl: './add-rebuy.component.html',
    styleUrls: ['./add-rebuy.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, JsonPipe, MatFormFieldModule, MatOptionModule, MatSelectModule, UserWithImageComponent]
})
export class AddRebuyComponent extends BaseAddDialogComponent<AddRebuyComponent, AddRebuyModel> implements OnInit {

    playersToRebuy: Signal<{ label: string, value: number }[]>;
    eliminators: Signal<{ label: string, value: number }[]>;
    conductedRebuys: Signal<ConductedEntry[]>;

    private tournamentService: TournamentService = inject(TournamentService);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);
    private state: TimerStateService = inject(TimerStateService);
    private timerApiService: TimerApiService = inject(TimerApiService);

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
        this.playersToRebuy = this.state.playersToRebuy;
        this.conductedRebuys = this.state.conductedRebuys;
        this.eliminators = computed(() =>
            this.playersToRebuy().filter(p => p.value !== this.model.playerId())
        );
    }

    onSubmit(): void {
        const playerId = this.model.playerId();
        const eliminatedById = this.model.eliminatedBy();
        this.isLoadingAdd = true;

        if (playerId && eliminatedById) {
            this.timerApiService.rebuy$(this.tournamentService.getRebuyEvent(playerId, eliminatedById)).pipe(
                take(1),
                tap((a) => {
                    this.fetchService.trigger();
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.notificationService.error(`Error adding Rebuy`);
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        }
    }

    deleteRebuy(entryId: number, playerName: string): void {
        this.isLoadingRemove = true;

        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Rebuy',
                        body: `Do you really want to remove the rebuy of <strong>${playerName}</strong> from tournament <strong>${this.state.tournament().name}</strong>`,
                        confirm: 'Remove Rebuy',
                        isDelete: true
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.timerApiService.deleteRebuy$(
                            this.tournamentService.getDeleteRebuyEvent(entryId, playerName)
                        ).pipe(
                            take(1),
                            tap((a) => {
                                this.fetchService.trigger();
                                this.isLoadingRemove = false;
                            }),
                            catchError(() => {
                                this.notificationService.error('Error removing Rebuy');
                                this.isLoadingRemove = false;
                                return of(null);
                            }),
                        )),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

}
