import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Player } from '../../../../shared/models/player.interface';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { forkJoin, Observable } from 'rxjs';
import { ServerResponse } from '../../../../shared/models/server-response';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { take, tap } from 'rxjs/operators';
import { Finish } from '../../../../shared/models/finish.interface';

@Component({
    selector: 'app-make-deal',
    templateUrl: './make-deal.component.html',
    styleUrls: ['./make-deal.component.scss']
})
export class MakeDealComponent implements OnInit {

    private dialogRef: MatDialogRef<MakeDealComponent> = inject(MatDialogRef<MakeDealComponent>);
    data: { tournament: Tournament, metadata: SeriesMetadata | undefined } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    fields: FormlyFieldConfig[];
    model: { [key: string]: number } = {};

    toDistribute: number = 0;
    rankAfterDeal: number;
    total: number = 0;
    keys: string[];

    finishesToReturn: Finish[];

    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);

    ngOnInit(): void {
        const pricePool = this.getPricePool(this.data.tournament);
        const contribution = pricePool * (this.data.metadata?.percentage ?? 0) / 100;
        const effectivePricePool = pricePool - contribution;

        const sumPayed = this.data.tournament.finishes.map(
            f => f.price
        ).reduce(
            (acc, curr) => +acc + +curr, 0
        );

        this.toDistribute = effectivePricePool - sumPayed;
        const noOfRemainingPlaces = this.data.tournament.players.length - this.data.tournament.finishes.length;
        const finishedPlayers = this.data.tournament.finishes.map(f => f.playerId);

        const remainingPlayers = this.data.tournament.players.filter(
            (player: Player) => !finishedPlayers.includes(player.id)
        );

        const remainingPlaces = Array.from({length: noOfRemainingPlaces}, (_, i) => i + 1);
        this.rankAfterDeal = remainingPlaces.reduce((acc, curr) => acc + curr, 0) / remainingPlaces.length;

        console.log('pricepool', pricePool);
        console.log('contr', contribution);
        console.log('effective pp', effectivePricePool);
        console.log('payed', sumPayed);
        console.log('to distribute', this.toDistribute);
        console.log('remaining places', noOfRemainingPlaces);
        console.log('remaining', remainingPlaces);
        console.log('rank', this.rankAfterDeal);
        console.log('not finihsed', remainingPlayers);

        this.fields = [];
        this.keys = [];

        remainingPlayers.forEach(
            (player: Player) => {
                const key = player.id.toString();
                this.keys.push(key);
                this.model[key] = 0;

                this.fields.push(
                    this.formlyFieldService.getDefaultNumberField(key, player.name, true)
                );
            });

    }

    getPricePool(tournament: Tournament): number {
        const buyInsReEntries: number = tournament.entries.filter(
            (entry: Entry) => entry.type === 'ENTRY' || entry.type === 'RE-ENTRY'
        ).length * tournament.buyInAmount;

        const rebuys: number = tournament.entries.filter(e => e.type === 'REBUY').length * tournament.rebuyAmount;
        const addons: number = tournament.entries.filter(e => e.type === 'ADDON').length * tournament.addonAmount;

        return buyInsReEntries + rebuys + addons + +tournament.initialPricePool;
    }

    modelChange(model: { [key: string]: number }): void {
        this.total = 0;

        this.keys.forEach(k => this.total += model[k]);
    }

    onSubmit(model: { [key: string]: number }): void {
        const streams: Observable<ServerResponse>[] = [];
        this.finishesToReturn = [];
        this.keys.forEach(k => {
            this.finishesToReturn.push({
                playerId: +k,
                price: model[k],
                rank: this.rankAfterDeal,
                tournamentId: this.data.tournament.id
            });

            streams.push(
                this.finishApiService.post$({
                    playerId: +k,
                    price: model[k],
                    rank: this.rankAfterDeal,
                    tournamentId: this.data.tournament.id
                })
            );
        });

        forkJoin(streams).pipe(
            take(1),
            tap(e => console.log('e')),
            tap(() => {
                if (this.dialogRef) {
                    this.dialogRef.close(this.finishesToReturn);
                }
            })
        ).subscribe();
    }

}
