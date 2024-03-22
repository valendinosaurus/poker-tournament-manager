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
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';

@Component({
    selector: 'app-add-addon',
    templateUrl: './add-addon.component.html',
    styleUrls: ['./add-addon.component.scss']
})
export class AddAddonComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddAddonComponent> = inject(MatDialogRef<AddAddonComponent>);
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
    private notificationService: NotificationService = inject(NotificationService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private tEventApiService: TEventApiService = inject(TEventApiService);

    allPlayers: { label: string, value: number }[];
    eligibleForAddon: Player[];
    conductedAddons: ConductedEntry[];

    private dialog: MatDialog = inject(MatDialog);

    ngOnInit(): void {
        this.fetchService.getFetchTrigger$().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.tournamentApiService.get2$(this.data.tournamentId, this.data.sub)),
            tap((tournament: Tournament) => {
                this.eligibleForAddon = this.tournamentService.getPlayersEligibleForAddon(tournament);
                this.allPlayers = this.eligibleForAddon.map(
                    player => ({
                        label: player.name,
                        value: player.id
                    })
                );

                this.conductedAddons = this.tournamentService.getConductedAddons(tournament);

                this.initModel();
                this.initFields();
            })
        ).subscribe();
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
                type: EntryType.ADDON,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error('Error adding Addon');
                    return of(null);
                }),
                tap(() => {
                    const playerName = this.eligibleForAddon.filter(e => e.id === model.playerId)[0].name;
                    this.notificationService.success(`Addon - ${playerName}`);
                }),
                switchMap(() => {
                    const playerName = this.eligibleForAddon.filter(e => e.id === model.playerId)[0].name;

                    return this.tEventApiService.post$(
                        this.data.tournamentId,
                        `Addon for ${playerName}!`,
                        TEventType.ADDON
                    );
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

    deleteAddon(entryId: number, playerName: string): void {
        if (entryId > -1) {
            const dialogRef = this.dialog.open(
                ConfirmationDialogComponent,
                {
                    data: {
                        title: 'Remove Addon',
                        body: `Do you really want to remove the addon of <strong>${playerName}</strong> from tournament <strong>${this.data.tournamentName}</strong>`,
                        confirm: 'Remove Addon'
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
                            tap(() => {
                                this.notificationService.success(`Addon deleted - ${playerName}`);
                            }),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.data.tournamentId,
                                    `${playerName} cancelled his Addon!`,
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
