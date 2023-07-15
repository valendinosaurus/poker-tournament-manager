import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Player } from '../../../../shared/models/player.interface';
import { switchMap, tap } from 'rxjs/operators';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';

@Component({
    selector: 'app-add-player',
    templateUrl: './add-player.component.html',
    styleUrls: ['./add-player.component.scss']
})
export class AddPlayerComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    modelMulti: { playerIds: number[] | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    data: { tournament: Tournament, multi: boolean } = inject(MAT_DIALOG_DATA);
    private dialogRef: MatDialogRef<AddPlayerComponent> = inject(MatDialogRef<AddPlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);

    allPlayers: { label: string, value: number }[];

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            tap((players: Player[]) => {
                this.allPlayers = players
                    .filter(
                        player => !this.data.tournament.players.map(p => p.id).includes(player.id)
                    )
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
        if (this.data.multi) {
            this.modelMulti = {
                playerIds: [],
                tournamentId: this.data.tournament.id ?? -1
            };
        } else {
            this.model = {
                playerId: undefined,
                tournamentId: this.data.tournament.id ?? -1
            };
        }
    }

    private initFields(): void {
        if (this.data.multi) {
            this.fields = [
                this.formlyFieldService.getDefaultMultiSelectField('playerIds', 'Players', true, this.allPlayers)
            ];
        } else {
            this.fields = [
                this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
            ];
        }
    }

    onSubmit(model: { playerId: number | undefined, tournamentId: number }): void {
        if (model.playerId && model.tournamentId) {
            this.tournamentApiService.addPlayer$(model.playerId, model.tournamentId).pipe(
                switchMap(
                    () => this.entryApiService.post$({
                        id: undefined,
                        playerId: model.playerId ?? 0,
                        tournamentId: model.tournamentId,
                        type: 'ENTRY'
                    }).pipe(
                        tap((result: any) => {
                            if (this.dialogRef) {
                                this.dialogRef.close({
                                    entryId: result.id,
                                    playerId: model.playerId
                                });
                            }
                        })
                    )
                )
            ).subscribe();
        }
    }

    onSubmitMulti(model: { playerIds: number[] | undefined, tournamentId: number }): void {
        if (model.playerIds && model.tournamentId) {
            this.tournamentApiService.addPlayers$(model.playerIds, model.tournamentId).pipe(
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            playerIds: model.playerIds
                        });
                    }
                })
            ).subscribe();
        }
    }

}
