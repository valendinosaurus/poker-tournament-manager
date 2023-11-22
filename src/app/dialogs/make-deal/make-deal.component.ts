import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { Player } from '../../shared/models/player.interface';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { forkJoin, Observable, of } from 'rxjs';
import { ServerResponse } from '../../shared/models/server-response';
import { FinishApiService } from '../../core/services/api/finish-api.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../core/services/fetch.service';
import { EventApiService } from '../../core/services/api/event-api.service';
import { RankingService } from '../../core/services/util/ranking.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-make-deal',
    templateUrl: './make-deal.component.html',
    styleUrls: ['./make-deal.component.scss']
})
export class MakeDealComponent implements OnInit {

    private dialogRef: MatDialogRef<MakeDealComponent> = inject(MatDialogRef<MakeDealComponent>);
    data: {
        tournament: Tournament,
        metadata: SeriesMetadata | undefined,
        randomId: number
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    fields: FormlyFieldConfig[];
    model: { [key: string]: number } = {};

    toDistribute: number = 0;
    rankAfterDeal: number;
    total: number = 0;
    keys: string[];

    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);
    private rankingService: RankingService = inject(RankingService);
    private notificationService: NotificationService = inject(NotificationService);

    ngOnInit(): void {
        const pricePool = this.rankingService.getSimplePricePool(this.data.tournament);
        const contribution = pricePool * (this.data.metadata?.percentage ?? 0) / 100;
        const realContribution = contribution > (this.data.metadata?.maxAmountPerTournament ?? 0) ? (this.data.metadata?.maxAmountPerTournament ?? 0) : contribution;
        const effectivePricePool = pricePool - realContribution;

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

    modelChange(model: { [key: string]: number }): void {
        this.total = 0;

        this.keys.forEach(k => this.total += model[k]);
    }

    onSubmit(model: { [key: string]: number }): void {
        const streams: Observable<ServerResponse>[] = [];
        this.keys.forEach(k => {
            streams.push(
                this.finishApiService.post$({
                    playerId: +k,
                    price: model[k],
                    rank: this.rankAfterDeal,
                    tournamentId: this.data.tournament.id,
                    timestamp: -1
                })
            );
        });

        forkJoin(streams).pipe(
            take(1),
            catchError(() => {
                this.notificationService.error(`Error making Deal`);
                return of(null);
            }),
            tap(() => {
                const playerName = this.data.tournament.players.filter(e => e.id === model.playerId)[0].name;
                this.notificationService.success('Deal was made');
            }),
            tap(() => this.fetchService.trigger()),
            switchMap(() => this.eventApiService.post$({
                id: null,
                tId: this.data.tournament.id,
                clientId: this.data.randomId
            })),
            tap(() => {
                if (this.dialogRef) {
                    this.dialogRef.close();
                }
            })
        ).subscribe();
    }

}
