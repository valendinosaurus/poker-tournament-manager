import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { FetchService } from '../../../../core/services/fetch.service';
import { EventApiService } from '../../../../core/services/api/event-api.service';
import { ConductedEntry } from '../../../../shared/models/conducted-entry.interface';

@Component({
    selector: 'app-add-rebuy',
    templateUrl: './add-rebuy.component.html',
    styleUrls: ['./add-rebuy.component.scss']
})
export class AddRebuyComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddRebuyComponent> = inject(MatDialogRef<AddRebuyComponent>);

    data: {
        tournamentId: number,
        eligibleForRebuy: Player[]
        randomId: number,
        conductedRebuys: ConductedEntry[]
    } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.allPlayers = this.data.eligibleForRebuy.map(
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
                type: 'REBUY',
                timestamp: -1
            }).pipe(
                take(1),
                tap((a) => this.fetchService.trigger()),
                switchMap(() => this.eventApiService.post$({
                    id: null,
                    tId: this.data.tournamentId,
                    clientId: this.data.randomId
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

    deleteRebuy(entryId: number): void {
        if (entryId > -1) {
            this.entryApiService.delete$(entryId).pipe(
                take(1),
                tap((a) => this.fetchService.trigger()),
                switchMap(() => this.eventApiService.post$({
                    id: null,
                    tId: this.data.tournamentId,
                    clientId: this.data.randomId
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

}
