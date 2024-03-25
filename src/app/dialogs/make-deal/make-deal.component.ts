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
import { ActionEventApiService } from '../../core/services/api/action-event-api.service';
import { RankingService } from '../../core/services/util/ranking.service';
import { NotificationService } from '../../core/services/notification.service';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';

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
        clientId: number
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
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private rankingService: RankingService = inject(RankingService);
    private notificationService: NotificationService = inject(NotificationService);
    private tEventApiService: TEventApiService = inject(TEventApiService);

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

                this.fields.push({
                    ...this.formlyFieldService.getDefaultNumberField(key, player.name, true),
                });
            });
    }

    modelChange(model: { [key: string]: number }): void {
        this.total = 0;

        this.keys.forEach(k => this.total += model[k]);
    }

    distributeEvenly(event: Event): void {
        event.preventDefault();
        const total = this.toDistribute;
        const noOfRemainingPlaces = this.data.tournament.players.length - this.data.tournament.finishes.length;

        const even = total / noOfRemainingPlaces;

        this.keys.forEach((key: string) => this.form.get(key)?.patchValue(even));

        this.form.updateValueAndValidity();
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
                    timestamp: -1,
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
                this.notificationService.success('Deal was made');
            }),
            switchMap(() => {
                let message = 'DEAL!! ';

                let names = ' ';

                for (let i = 0; i < this.keys.length - 1; i++) {
                    const name = this.data.tournament.players.filter(e => e.id === +this.keys[i])[0].name;

                    if (i > 0) {
                        names += ', ';
                    }

                    names += `<strong>${name}</strong>`;
                }

                for (let i = this.keys.length - 1; i <= this.keys.length - 1; i++) {
                    const name = this.data.tournament.players.filter(e => e.id === +this.keys[i])[0].name;

                    names += ` and <strong>${name}</strong> `;
                }

                message += names + `agreed to share ${this.rankAfterDeal}th place in the tournament with following payout:`;

                this.keys.forEach(k => {
                    const name = this.data.tournament.players.filter(e => e.id === +k)[0].name;
                    message += `<br>${name}: ${model[k]}.-`;
                });

                return this.tEventApiService.post$(this.data.tournament.id, message, TEventType.DEAL);
            }),
            tap(() => this.fetchService.trigger()),
            switchMap(() => this.eventApiService.post$({
                id: null,
                tId: this.data.tournament.id,
                clientId: this.data.clientId
            })),
            tap(() => {
                if (this.dialogRef) {
                    this.dialogRef.close();
                }
            })
        ).subscribe();
    }

}
