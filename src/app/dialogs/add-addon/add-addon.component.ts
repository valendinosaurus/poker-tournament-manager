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
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { AddAddonModel } from './add-addon-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { TimerApiService } from '../../shared/services/api/timer-api.service';

@Component({
    selector: 'app-add-addon',
    templateUrl: './add-addon.component.html',
    styleUrls: ['./add-addon.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, MatFormFieldModule, MatOptionModule, MatSelectModule]
})
export class AddAddonComponent extends BaseAddDialogComponent<AddAddonComponent, AddAddonModel> implements OnInit {

    playersToAddOn: Signal<{ label: string, value: number }[]>;
    conductedAddons: Signal<ConductedEntry[]>;

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
            isValid: computed(() => this.model.playerId() !== undefined)
        };
    }

    private initSignals(): void {
        this.playersToAddOn = this.state.playersToAddOn;
        this.conductedAddons = this.state.conductedAddons;
    }

    onSubmit(): void {
        const playerId = this.model.playerId();
        this.isLoadingAdd = true;

        if (playerId) {
            this.timerApiService.addon$(
                this.tournamentService.getAddonEvent(playerId)
            ).pipe(
                take(1),
                tap((a) => {
                    this.fetchService.trigger();
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.notificationService.error('Error adding Addon');
                    this.isLoadingAdd = false;
                    return of(null);
                }),
            ).subscribe();
        }
    }

    deleteAddon(entryId: number, playerName: string): void {
        this.isLoadingRemove = true;

        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Addon',
                        body: `Do you really want to remove the addon of <strong>${playerName}</strong> from tournament <strong>${this.state.tournament().name}</strong>`,
                        confirm: 'Remove Addon',
                        isDelete: true
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.timerApiService.deleteAddon$(
                            this.tournamentService.getDeleteAddonEvent(entryId, playerName)
                        ).pipe(
                            take(1),
                            tap((a) => {
                                this.isLoadingRemove = false;
                                this.fetchService.trigger();
                            }),
                            catchError(() => {
                                this.notificationService.error('Error removing Addon');
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
