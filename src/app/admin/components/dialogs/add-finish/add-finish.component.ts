import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { tap } from 'rxjs/operators';
import { Player } from '../../../../shared/models/player.interface';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { Entry } from '../../../../shared/models/entry.interface';

@Component({
    selector: 'app-add-finish',
    templateUrl: './add-finish.component.html',
    styleUrls: ['./add-finish.component.scss']
})
export class AddFinishComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: { playerId: number | undefined, tournamentId: number };
    fields: FormlyFieldConfig[];

    private dialogRef: MatDialogRef<AddFinishComponent> = inject(MatDialogRef<AddFinishComponent>);
    data: { tournament: Tournament } = inject(MAT_DIALOG_DATA);

    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);

    allPlayers: { label: string, value: number }[];

    rank = 0;
    price = 0;

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            tap((players: Player[]) => {
                this.allPlayers = players
                    .filter(
                        player => this.data.tournament.players.map(p => p.id).includes(player.id)
                    )
                    .filter(player => {
                        const finishedIds = this.data.tournament.finishes.map(f => f.playerId);

                        return !finishedIds.includes(player.id ?? 0);
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

        this.rank = this.data.tournament.players.length - this.data.tournament.finishes.length;

        const payoutRaw = this.data.tournament.payout.split(' ');

        const payoutPercentage = +payoutRaw[this.rank - 1];

        if (payoutPercentage) {

            const totalMoney = this.data.tournament.entries.filter(
                    (entry: Entry) => entry.type !== 'ADDON'
                ).length * this.data.tournament.buyIn
                + this.data.tournament.entries.filter(e => e.type === 'ADDON').length * this.data.tournament.addon;


            this.price = totalMoney / 100 * payoutPercentage;
        } else {
            this.price = 0;
        }
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
            this.finishApiService.post$({
                playerId: model.playerId,
                tournamentId: model.tournamentId,
                price: this.price,
                rank: this.rank
            }).pipe(
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            finishId: result.id
                        });
                    }
                })
            ).subscribe();
        }
    }

}
