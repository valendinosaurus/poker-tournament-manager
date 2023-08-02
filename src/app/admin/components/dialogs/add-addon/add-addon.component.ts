import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { take, tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    data: { tournament: Tournament } = inject(MAT_DIALOG_DATA);

    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private destroyRef = inject(DestroyRef);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((players: Player[]) => {
                this.allPlayers = players
                    .filter(
                        player => this.data.tournament.players.map(p => p.id).includes(player.id)
                    )
                    .filter(player => {
                        const allowed = 1;
                        const rebuysOfPlayer = this.data.tournament.entries.filter(
                            (entry: Entry) => entry.playerId === player.id && entry.type === 'ADDON'
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
                type: 'ADDON'
            }).pipe(
                take(1),
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
