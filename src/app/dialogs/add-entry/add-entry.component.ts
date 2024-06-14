import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../core/services/fetch.service';
import { ConductedEntry } from '../../shared/interfaces/util/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { TournamentService } from '../../core/services/util/tournament.service';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, JsonPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { AddEntryModel } from './add-entry-model.interface';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';

@Component({
    selector: 'app-add-re-entry',
    templateUrl: './add-entry.component.html',
    styleUrls: ['./add-entry.component.scss'],
    standalone: true,
    imports: [NgIf, FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgFor, UserImageRoundComponent, DatePipe, MatFormFieldModule, MatOptionModule, MatSelectModule, JsonPipe, NgTemplateOutlet]
})
export class AddEntryComponent extends BaseAddDialogComponent<AddEntryComponent, AddEntryModel> implements OnInit {

    playersToEnter: Signal<{ label: string, value: number }[]>;
    conductedEntries: Signal<ConductedEntry[]>;

    data: {
        isReentry: boolean,
    } = inject(MAT_DIALOG_DATA);

    private tournamentService: TournamentService = inject(TournamentService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);
    private tEventApiService: TEventApiService = inject(TEventApiService);
    private state: TimerStateService = inject(TimerStateService);

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.initModel();

        const players = this.data.isReentry
            ? this.state.eligibleForReEntry
            : this.state.eligibleForEntry;

        this.playersToEnter = computed(() => players().map(
            player => ({
                label: player.name,
                value: player.id
            })
        ));

        this.conductedEntries = this.state.conductedEntries;
    }

    private initModel(): void {
        this.model = {
            playerId: signal(undefined),
            isValid: computed(() => this.model.playerId() !== undefined)
        };
    }

    onSubmit(): void {
        const playerId = this.model.playerId();
        this.isLoadingAdd = true;

        if (playerId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: playerId,
                tournamentId: this.state.tournament().id,
                type: this.data.isReentry ? EntryType.RE_ENTRY : EntryType.ENTRY,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error(`Error ${this.data.isReentry ? 'Re-Entry' : 'Entry'}`);
                    this.isLoadingAdd = false;
                    return of(null);
                }),
                tap(() => {
                    const playerName = this.playersToEnter().filter(e => e.value === playerId)[0].label;
                    this.notificationService.success(`${this.data.isReentry ? 'Re-Entry' : 'Entry'} - ${playerName}`);
                }),
                switchMap(() => {
                    const playerName = this.playersToEnter().filter(e => e.value === playerId)[0].label;

                    return this.tEventApiService.post$(
                        this.state.tournament().id,
                        `<strong>${playerName}</strong> entered the tournament!`,
                        TEventType.ENTRY
                    );
                }),
                tap((a) => {
                    this.fetchService.trigger();
                    this.isLoadingAdd = false;
                }),
                this.tournamentService.postActionEvent$
            ).subscribe();
        }
    }

    removeEntry(entryId: number, playerName: string): void {
        this.isLoadingRemove = true;

        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Entry',
                        body: `Do you really want to remove the entry of <strong>${playerName}</strong> from tournament <strong>${this.state.tournament().name}</strong>`,
                        confirm: 'Remove Entry',
                        isDelete: true
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.entryApiService.delete$(entryId).pipe(
                                take(1),
                                catchError(() => {
                                    this.notificationService.error('Error removing Entry');
                                    this.isLoadingRemove = false;
                                    return of(null);
                                }),
                                tap(() => {
                                    this.notificationService.success(`Entry deleted - ${playerName}`);
                                }),
                                switchMap(() => {
                                    return this.tEventApiService.post$(
                                        this.state.tournament().id,
                                        `<strong>${playerName}</strong> left the tournament!`,
                                        TEventType.CORRECTION
                                    );
                                }),
                                tap((a) => {
                                    this.fetchService.trigger();
                                    this.isLoadingRemove = false;
                                }),
                                this.tournamentService.postActionEvent$,
                            )
                        ),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

}
