import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../shared/models/player.interface';
import { FinishApiService } from '../../core/services/api/finish-api.service';
import { RankingService } from '../../core/services/util/ranking.service';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { LocalStorageService } from '../../core/services/util/local-storage.service';
import { Finish } from '../../shared/models/finish.interface';
import { defer, iif, of } from 'rxjs';
import { FetchService } from '../../core/services/fetch.service';
import { EventApiService } from '../../core/services/api/event-api.service';
import { Tournament } from '../../shared/models/tournament.interface';
import { NotificationService } from '../../core/services/notification.service';
import { ConductedFinish } from '../../shared/models/conducted-finish.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TournamentApiService } from '../../core/services/api/tournament-api.service';
import { TournamentService } from '../../core/services/util/tournament.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    data: {
        tournament: Tournament,
        metadata: SeriesMetadata | undefined,
        clientId: number,
        sub: string
    } = inject(MAT_DIALOG_DATA);

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private tournamentService: TournamentService = inject(TournamentService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private rankingService: RankingService = inject(RankingService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);
    private notificationService: NotificationService = inject(NotificationService);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private dialog: MatDialog = inject(MatDialog);

    allPlayers: { label: string, value: number }[];
    eligibleForSeatOpen: Player[];
    conductedSeatOpens: ConductedFinish[];
    tournament: Tournament;

    rank = 0;
    price = 0;

    ngOnInit(): void {
        this.fetchService.getFetchTrigger$().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.tournamentApiService.get2$(this.data.tournament.id, this.data.sub)),
            tap((tournament: Tournament) => {
                this.tournament = tournament;
                this.eligibleForSeatOpen = this.tournamentService.getPlayersEligibleForSeatOpen(tournament);
                this.allPlayers = this.eligibleForSeatOpen.map(
                    player => ({
                        label: player.name,
                        value: player.id
                    })
                );

                this.conductedSeatOpens = this.tournamentService.getConductedSeatOpens(tournament);

                this.initModel();
                this.initFields();
                this.calcRanksAndPrices(tournament);
            })
        ).subscribe();

        this.fetchService.trigger();
    }

    private determineAllPlayers(): void {
        this.allPlayers = this.eligibleForSeatOpen.map(
            player => ({
                label: player.name,
                value: player.id
            })
        );
    }

    private initModel(): void {
        this.model = {
            playerId: undefined,
            tournamentId: this.data.tournament.id
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultSelectField('playerId', 'Player', true, this.allPlayers)
        ];
    }

    private calcRanksAndPrices(tournament: Tournament): void {
        console.log('in cal ranks', this.data.tournament);
        this.rank = tournament.players.length - tournament.finishes.length;
        const payoutRaw = this.rankingService.getPayoutById(tournament.payout);
        const payoutPercentage = payoutRaw[this.rank - 1];

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(tournament.id);
        const placesPaid = payoutRaw.length;

        if (this.rank > placesPaid) {
            this.price = 0;
        } else {
            if (adaptedPayouts && adaptedPayouts.length === payoutRaw.length) {
                this.price = adaptedPayouts[this.rank - 1];
            } else {
                const {totalPricePool} = this.rankingService.getTotalPricePool(
                    tournament.entries,
                    tournament.buyInAmount,
                    tournament.rebuyAmount,
                    tournament.addonAmount,
                    tournament.initialPricePool,
                    this.data.metadata?.percentage,
                    this.data.metadata?.maxAmountPerTournament
                );

                this.price = totalPricePool / 100 * payoutPercentage;
            }
        }

        this.conductedSeatOpens = this.tournamentService.getConductedSeatOpens(tournament);
    }

    onSubmit(model: { playerId: number | undefined, tournamentId: number }): void {
        if (model.playerId && model.tournamentId) {
            this.finishApiService.post$({
                playerId: model.playerId,
                tournamentId: model.tournamentId,
                price: this.price,
                rank: this.rank,
                timestamp: -1
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error('Error Seat Open');
                    return of(null);
                }),
                tap(() => {
                    this.tournament.finishes.push({
                        playerId: model.playerId ?? -1,
                        tournamentId: model.tournamentId,
                        price: this.price,
                        rank: this.rank,
                        timestamp: -1
                    });
                    const playerName = this.data.tournament.players.filter(e => e.id === model.playerId)[0].name;
                    this.notificationService.success(`Seat Open - ${playerName}`);
                }),
                switchMap(() => iif(
                    () => this.rank === 2,
                    defer(() => this.finishApiService.post$(this.getRemainingFinish())),
                    of(null)
                )),
                tap(() =>
                    this.fetchService.trigger()),
                switchMap(() => this.eventApiService.post$({
                    id: null,
                    tId: this.data.tournament.id,
                    clientId: this.data.clientId
                })),
                tap((result: any) => {
                    if (this.dialogRef) {
                        this.dialogRef.close({
                            finishId: result.id,
                            name: this.data.tournament.players.find(e => e.id === model.playerId)?.name
                        });
                    }
                })
            ).subscribe();
        }
    }

    private getRemainingFinish(): Finish {
        const playerId = this.tournament.players.filter(
            (player: Player) => {
                const finishIds = this.tournament.finishes.map(f => f.playerId);

                return !finishIds.includes(player.id);
            }
        )[0].id;

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.tournament.id);
        const payouts = this.rankingService.getPayoutById(this.tournament.payout);
        const payoutPercentage = +payouts[0];

        let price = 0;

        if (adaptedPayouts) {
            price = adaptedPayouts[this.rank - 2];
        } else {
            const {totalPricePool} = this.rankingService.getTotalPricePool(
                this.tournament.entries,
                this.tournament.buyInAmount,
                this.tournament.rebuyAmount,
                this.tournament.addonAmount,
                this.tournament.initialPricePool,
                this.data.metadata?.percentage,
                this.data.metadata?.maxAmountPerTournament
            );

            price = totalPricePool / 100 * payoutPercentage;
        }

        return {
            rank: 1,
            tournamentId: this.data.tournament.id,
            price,
            playerId,
            timestamp: -1
        };
    }

    removeSeatOpen(pId: number, playerName: string): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Remove Seat Open',
                    body: `Do you really want to remove the seat open of <strong>${playerName}</strong>`,
                    confirm: 'Remove Seat Open'
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((result: boolean) => iif(
                    () => result,
                    defer(() => this.finishApiService.delete$(this.data.tournament.id, pId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Seat Open');
                                return of(null);
                            }),
                            tap(() => {
                                this.notificationService.success(`Seat Open removed - ${playerName}`);
                                console.log('rank + 1');
                                this.rank = this.rank + 1;
                            }),
                            tap(() => {
                                this.fetchService.trigger();
                            }),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournament.id,
                                clientId: this.data.clientId
                            })),
                            tap(() => {
                                // this.allPlayers.push({
                                //     label: playerName,
                                //     value: pId
                                // });

                                // this.initModel();
                                // this.initFields();
                                // this.data.tournament.finishes = this.data.tournament.finishes.filter(
                                //     (finish: Finish) => finish.playerId !== pId
                                // );
                                //
                                // this.calcRanksAndPrices();
                            })
                        )
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

}
