import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EntryApiService } from '../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../shared/models/player.interface';
import { FetchService } from '../../core/services/fetch.service';
import { EventApiService } from '../../core/services/api/event-api.service';
import { ConductedEntry } from '../../shared/models/conducted-entry.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { EntryType } from '../../shared/enums/entry-type.enum';

@Component({
    selector: 'app-add-re-entry',
    templateUrl: './add-entry.component.html',
    styleUrls: ['./add-entry.component.scss']
})
export class AddEntryComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddEntryComponent> = inject(MatDialogRef<AddEntryComponent>);
    data: {
        tournamentId: number,
        isReentry: boolean,
        clientId: number,
        eligibleForEntryOrReEntry: Player[],
        conductedEntries: ConductedEntry[]
        tournamentName: string,
    } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);
    private notificationService: NotificationService = inject(NotificationService);

    allPlayers: { label: string, value: number }[];

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.allPlayers = this.data.eligibleForEntryOrReEntry.map(
            player => ({
                label: player.name,
                value: player.id
            })
        );

        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            playerId: undefined,
            tournamentId: this.data.tournamentId
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
        ];
    }

    onSubmit(model: { playerId: number | undefined, tournamentId: number }): void {
        if (model.playerId && model.tournamentId) {
            this.entryApiService.post$({
                id: undefined,
                playerId: model.playerId,
                tournamentId: model.tournamentId,
                type: this.data.isReentry ? EntryType.RE_ENTRY : EntryType.ENTRY,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error(`Error ${this.data.isReentry ? 'Re-Entry' : 'Entry'}`);
                    return of(null);
                }),
                tap(() => {
                    const playerName = this.data.eligibleForEntryOrReEntry.filter(e => e.id === model.playerId)[0].name;
                    this.notificationService.success(`${this.data.isReentry ? 'Re-Entry' : 'Entry'} - ${playerName}`);
                }),
                tap((a) => this.fetchService.trigger()),
                switchMap(() => this.eventApiService.post$({
                    id: null,
                    tId: this.data.tournamentId,
                    clientId: this.data.clientId
                })),
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            entryId: result.id
                        });
                    }
                })
            ).subscribe();
        }
    }

    removeEntry(entryId: number, playerName: string): void {
        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Entry',
                        body: `Do you really want to remove the entry of <strong>${playerName}</strong> from tournament <strong>${this.data.tournamentName}</strong>`,
                        confirm: 'Remove Entry'
                    }
                });

            dialogRef.afterClosed().pipe(
                switchMap((result: boolean) => iif(
                        () => result,
                        defer(() => this.entryApiService.delete$(entryId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Entry');
                                return of(null);
                            }),
                            tap(() => {
                                this.notificationService.success(`Entry deleted - ${playerName}`);
                            }),
                            tap((a) => this.fetchService.trigger()),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournamentId,
                                clientId: this.data.clientId
                            })),
                            tap(() => this.data.conductedEntries = this.data.conductedEntries.filter(
                                ce => ce.entryId !== entryId
                            )))
                        ),
                        defer(() => of(null))
                    )
                )
            ).subscribe();
        }
    }

}
