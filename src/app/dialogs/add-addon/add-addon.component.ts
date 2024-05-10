import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../core/services/fetch.service';
import { ConductedEntry } from '../../shared/models/util/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { TournamentService } from '../../core/services/util/tournament.service';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { AddAddonModel } from './add-addon-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-add-addon',
    templateUrl: './add-addon.component.html',
    styleUrls: ['./add-addon.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, MatFormFieldModule, MatOptionModule, MatSelectModule]
})
export class AddAddonComponent implements OnInit {

    playersToAddOn: Signal<{ label: string, value: number }[]>;
    conductedAddons: Signal<ConductedEntry[]>;

    model: AddAddonModel;

    private dialogRef: MatDialogRef<AddAddonComponent> = inject(MatDialogRef<AddAddonComponent>);

    private tournamentService: TournamentService = inject(TournamentService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private fetchService: FetchService = inject(FetchService);
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
            isValid: computed(() => this.model.playerId() !== undefined)
        };
    }

    private initSignals(): void {
        this.playersToAddOn = computed(() => this.timerStateService.eligibleForAddon().map(player => ({
                label: player.name,
                value: player.id
            })
        ));

        this.conductedAddons = this.timerStateService.conductedAddons;
    }

    onSubmit(): void {
        const playerId = this.model.playerId();

        if (playerId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: playerId,
                tournamentId: this.timerStateService.tournament().id,
                type: EntryType.ADDON,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error('Error adding Addon');
                    return of(null);
                }),
                switchMap(() => {
                    const playerName = this.playersToAddOn().filter(e => e.value === playerId)[0].label;

                    return this.tEventApiService.post$(
                        this.timerStateService.tournament().id,
                        `Addon for <strong>${playerName}</strong>!`,
                        TEventType.ADDON
                    );
                }),
                tap((a) => this.fetchService.trigger()),
                this.tournamentService.postActionEvent$,
            ).subscribe();
        }
    }

    deleteAddon(entryId: number, playerName: string): void {
        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Addon',
                        body: `Do you really want to remove the addon of <strong>${playerName}</strong> from tournament <strong>${this.timerStateService.tournament().name}</strong>`,
                        confirm: 'Remove Addon',
                        isDelete: true
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.entryApiService.delete$(entryId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Addon');
                                return of(null);
                            }),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.timerStateService.tournament().id,
                                    `<strong>${playerName}</strong> cancelled his Addon!`,
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
