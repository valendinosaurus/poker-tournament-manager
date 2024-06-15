import { Component, inject, OnInit, WritableSignal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../shared/interfaces/series.interface';
import { Player } from '../../shared/interfaces/player.interface';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { FormlyFieldService } from '../../shared/services/util/formly-field.service';
import { forkJoin, Observable, of } from 'rxjs';
import { ServerResponse } from '../../shared/interfaces/server-response';
import { FinishApiService } from '../../shared/services/api/finish-api.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../shared/services/fetch.service';
import { RankingService } from '../../shared/services/util/ranking.service';
import { NotificationService } from '../../shared/services/notification.service';
import { TEventApiService } from '../../shared/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';
import { MatButtonModule } from '@angular/material/button';
import { TournamentService } from '../../shared/services/util/tournament.service';
import { TimerStateService } from '../../timer/services/timer-state.service';

@Component({
    selector: 'app-make-deal',
    templateUrl: './make-deal.component.html',
    styleUrls: ['./make-deal.component.scss'],
    standalone: true,
    imports: [FormsModule, FormlyModule, MatButtonModule]
})
export class MakeDealComponent implements OnInit {

    tournament: WritableSignal<Tournament>;
    metadata: WritableSignal<SeriesMetadata | undefined>;

    private dialogRef: MatDialogRef<MakeDealComponent> = inject(MatDialogRef<MakeDealComponent>);

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
    private tournamentService: TournamentService = inject(TournamentService);
    private rankingService: RankingService = inject(RankingService);
    private notificationService: NotificationService = inject(NotificationService);
    private tEventApiService: TEventApiService = inject(TEventApiService);
    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        this.tournament = this.state.tournament;
        this.metadata = this.state.metadata;

        const pricePool = this.rankingService.getSimplePricePool(this.tournament());
        const contribution = pricePool * (this.metadata()?.percentage ?? 0) / 100;
        const realContribution = contribution > (this.metadata()?.maxAmountPerTournament ?? 0) ? (this.metadata()?.maxAmountPerTournament ?? 0) : contribution;
        const effectivePricePool = pricePool - realContribution;

        const sumPayed = this.tournament().finishes.map(
            f => f.price
        ).reduce(
            (acc, curr) => +acc + +curr, 0
        );

        this.toDistribute = effectivePricePool - sumPayed;
        const noOfRemainingPlaces = this.tournament().players.length - this.tournament().finishes.length;
        const finishedPlayers = this.tournament().finishes.map(f => f.playerId);

        const remainingPlayers = this.tournament().players.filter(
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
        const noOfRemainingPlaces = this.tournament().players.length - this.tournament().finishes.length;

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
                    tournamentId: this.tournament().id,
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
                    const name = this.tournament().players.filter(e => e.id === +this.keys[i])[0].name;

                    if (i > 0) {
                        names += ', ';
                    }

                    names += `<strong>${name}</strong>`;
                }

                for (let i = this.keys.length - 1; i <= this.keys.length - 1; i++) {
                    const name = this.tournament().players.filter(e => e.id === +this.keys[i])[0].name;

                    names += ` and <strong>${name}</strong> `;
                }

                message += names + `agreed to share ${this.rankAfterDeal}th place in the tournament with following payout:`;

                this.keys.forEach(k => {
                    const name = this.tournament().players.filter(e => e.id === +k)[0].name;
                    message += `<br>${name}: ${model[k]}.-`;
                });

                return this.tEventApiService.post$(this.tournament().id, message, TEventType.DEAL);
            }),
            tap(() => this.fetchService.trigger()),
            this.tournamentService.postActionEvent$,
            tap(() => {
                if (this.dialogRef) {
                    this.dialogRef.close();
                }
            })
        ).subscribe();
    }

}
