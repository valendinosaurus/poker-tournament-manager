import { Component, inject, OnInit } from '@angular/core';
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
        eligibleForSeatOpen: Player[],
        conductedSeatOpens: ConductedFinish[]
    } = inject(MAT_DIALOG_DATA);

    private finishApiService: FinishApiService = inject(FinishApiService);
    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private rankingService: RankingService = inject(RankingService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private fetchService: FetchService = inject(FetchService);
    private eventApiService: EventApiService = inject(EventApiService);
    private notificationService: NotificationService = inject(NotificationService);

    private dialog: MatDialog = inject(MatDialog);

    allPlayers: { label: string, value: number }[];
    conductedSeatOpens: Player[];

    rank = 0;
    price = 0;

    ngOnInit(): void {
        this.allPlayers = this.data.eligibleForSeatOpen.map(
            player => ({
                label: player.name,
                value: player.id
            })
        );

        this.initModel();
        this.initFields();

        this.rank = this.data.tournament.players.length - this.data.tournament.finishes.length;
        const payoutRaw = this.rankingService.getPayoutById(this.data.tournament.payout);
        const payoutPercentage = payoutRaw[this.rank - 1];

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.data.tournament.id);
        const placesPaid = payoutRaw.length;

        if (this.rank > placesPaid) {
            this.price = 0;
        } else {
            if (adaptedPayouts && adaptedPayouts.length === payoutRaw.length) {
                this.price = adaptedPayouts[this.rank - 1];
            } else {
                const {totalPricePool} = this.rankingService.getTotalPricePool(
                    this.data.tournament.entries,
                    this.data.tournament.buyInAmount,
                    this.data.tournament.rebuyAmount,
                    this.data.tournament.addonAmount,
                    this.data.tournament.initialPricePool,
                    this.data.metadata?.percentage,
                    this.data.metadata?.maxAmountPerTournament
                );

                this.price = totalPricePool / 100 * payoutPercentage;
            }
        }

        this.conductedSeatOpens = this.data.tournament.players.filter(
            player => !this.data.eligibleForSeatOpen.map(
                e => e.id
            ).includes(player.id)
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
                    const playerName = this.data.tournament.players.filter(e => e.id === model.playerId)[0].name;
                    this.notificationService.success(`Seat Open - ${playerName}`);
                }),
                switchMap(() => iif(
                    () => this.rank === 2,
                    this.finishApiService.post$(this.getRemainingFinish()),
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
        const playerId = this.data.tournament.players.filter(
            (player: Player) => {
                const finishIds = this.data.tournament.finishes.map(f => f.playerId);

                return !finishIds.includes(player.id);
            }
        )[0].id;

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.data.tournament.id);
        const payouts = this.rankingService.getPayoutById(this.data.tournament.payout);
        const payoutPercentage = +payouts[0];

        let price = 0;

        if (adaptedPayouts) {
            price = adaptedPayouts[this.rank - 2];
        } else {
            const {totalPricePool} = this.rankingService.getTotalPricePool(
                this.data.tournament.entries,
                this.data.tournament.buyInAmount,
                this.data.tournament.rebuyAmount,
                this.data.tournament.addonAmount,
                this.data.tournament.initialPricePool,
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
                            }),
                            tap(() => {
                                this.fetchService.trigger();
                            }),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.data.tournament.id,
                                clientId: this.data.clientId
                            })),
                            tap(() => this.data.conductedSeatOpens = this.data.conductedSeatOpens.filter(
                                cso => cso.playerId !== pId
                            ))
                        )
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

}
