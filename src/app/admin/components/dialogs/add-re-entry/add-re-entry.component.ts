import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';

@Component({
    selector: 'app-add-re-entry',
    templateUrl: './add-re-entry.component.html',
    styleUrls: ['./add-re-entry.component.scss']
})
export class AddReEntryComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddReEntryComponent> = inject(MatDialogRef<AddReEntryComponent>);
    data: { tournament: Tournament } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            tap((players: Player[]) => {
                this.allPlayers = players
                    .filter(
                        player => this.data.tournament.players.map(p => p.id).includes(player.id)
                    )
                    .filter(player => {
                        const allowed = this.data.tournament.noOfReEntries;
                        const rebuysOfPlayer = this.data.tournament.entries.filter(
                            (entry: Entry) => entry.playerId === player.id && entry.type === 'RE-ENTRY'
                        ).length;

                        return rebuysOfPlayer < allowed;
                    })
                    .map(
                        player => ({
                            label: player.name,
                            value: player.id ?? 0
                        })
                    );

                this.initModel();
                this.initFields();
            })
        ).subscribe();
    }

    private initModel(): void {
        this.model = {
            playerId: undefined,
            tournamentId: this.data.tournament.id ?? 0
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
                playerId: model.playerId ?? 0,
                tournamentId: model.tournamentId,
                type: 'RE-ENTRY'
            }).pipe(
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
