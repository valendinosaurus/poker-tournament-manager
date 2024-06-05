import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog } from '@angular/material/dialog';
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
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';

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
    private entryApiService: EntryApiService = inject(EntryApiService);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);
    private tEventApiService: TEventApiService = inject(TEventApiService);
    private state: TimerStateService = inject(TimerStateService);

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
        this.playersToAddOn = computed(() => this.state.eligibleForAddon().map(player => ({
                label: player.name,
                value: player.id
            })
        ));

        this.conductedAddons = this.state.conductedAddons;
    }

    onSubmit(): void {
        const playerId = this.model.playerId();
        this.isLoadingAdd = true;

        if (playerId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: playerId,
                tournamentId: this.state.tournament().id,
                type: EntryType.ADDON,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error('Error adding Addon');
                    this.isLoadingAdd = false;
                    return of(null);
                }),
                switchMap(() => {
                    const playerName = this.playersToAddOn().filter(e => e.value === playerId)[0].label;

                    return this.tEventApiService.post$(
                        this.state.tournament().id,
                        `Addon for <strong>${playerName}</strong>!`,
                        TEventType.ADDON
                    );
                }),
                tap((a) => {
                    this.fetchService.trigger();
                    this.isLoadingAdd = false;
                }),
                this.tournamentService.postActionEvent$,
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
                        defer(() => this.entryApiService.delete$(entryId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Addon');
                                this.isLoadingRemove = false;
                                return of(null);
                            }),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.state.tournament().id,
                                    `<strong>${playerName}</strong> cancelled his Addon!`,
                                    TEventType.CORRECTION
                                );
                            }),
                            tap((a) => {
                                this.isLoadingRemove = false;
                                this.fetchService.trigger();
                            }),
                            this.tournamentService.postActionEvent$,
                        )),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

}
