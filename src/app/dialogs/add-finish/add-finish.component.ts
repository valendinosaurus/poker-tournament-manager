import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { Player } from '../../shared/models/player.interface';
import { FinishApiService } from '../../core/services/api/finish-api.service';
import { RankingService } from '../../core/services/util/ranking.service';
import { LocalStorageService } from '../../core/services/util/local-storage.service';
import { Finish } from '../../shared/models/finish.interface';
import { defer, iif, Observable, of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { ConductedFinish } from '../../shared/models/util/conducted-finish.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TournamentService } from '../../core/services/util/tournament.service';
import { ConductedElimination } from '../../shared/models/util/conducted-elimination.interface';
import { EliminationApiService } from '../../core/services/api/elimination-api.service';
import { TEventApiService } from '../../core/services/api/t-event-api.service';
import { TEventType } from '../../shared/enums/t-event-type.enum';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AddFinishModel } from './add-finish-model.interface';
import { ServerResponse } from '../../shared/models/server-response';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FetchService } from '../../core/services/fetch.service';

@Component({
    selector: 'app-add-finish',
    templateUrl: './add-finish.component.html',
    styleUrls: ['./add-finish.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, AsyncPipe, MatFormFieldModule, MatSelectModule]
})
export class AddFinishComponent implements OnInit {

    model: AddFinishModel;

    playersToEliminate: Signal<{ label: string, value: number }[]>;
    eliminators: Signal<{ label: string, value: number }[]>;
    conductedFinishes: Signal<ConductedFinish[]>;
    conductedEliminations: Signal<ConductedElimination[]>;
    totalPricePool: Signal<{ totalPricePool: number, deduction: number }>;

    isLoading: boolean;
    isLoadingAdd = false;
    isLoadingRemove = false;

    rank: WritableSignal<number> = signal(0);
    price: WritableSignal<number> = signal(0);
    winnerPrice: WritableSignal<number> = signal(0);

    private dialogRef: MatDialogRef<AddFinishComponent> = inject(MatDialogRef<AddFinishComponent>);
    private tournamentService: TournamentService = inject(TournamentService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private eliminationApiService: EliminationApiService = inject(EliminationApiService);
    private rankingService: RankingService = inject(RankingService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private tEventApiService: TEventApiService = inject(TEventApiService);
    private notificationService: NotificationService = inject(NotificationService);
    private dialog: MatDialog = inject(MatDialog);
    private state: TimerStateService = inject(TimerStateService);
    private fetchService: FetchService = inject(FetchService);

    ngOnInit(): void {
        this.initModel();
        this.initSignals();
        this.calcRanksAndPrices();
    }

    private initModel(): void {
        this.model = {
            playerId: signal(undefined),
            eliminatedBy: signal(undefined),
            isValid: computed(() =>
                this.model.playerId() !== undefined
                && this.model.eliminatedBy() !== undefined
                && this.model.playerId() !== this.model.eliminatedBy()
            )
        };
    }

    private initSignals(): void {
        this.playersToEliminate = computed(() => this.state.eligibleForSeatOpen().map(
            player => ({
                label: player.name,
                value: player.id
            })
        ));

        this.conductedFinishes = this.state.conductedFinishes;
        this.conductedEliminations = this.state.conductedEliminations;

        this.eliminators = computed(() =>
            this.playersToEliminate().filter(p => p.value !== this.model.playerId())
        );
    }

    private calcRanksAndPrices(): void {
        this.rank.set(this.state.tournament().players.length - this.state.tournament().finishes.length);
        const payoutRaw = this.rankingService.getPayoutById(this.state.tournament().payout);
        const payoutPercentage = payoutRaw[this.rank() - 1];

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.state.tournament().id);
        const placesPaid = payoutRaw.length;

        if (this.rank() > placesPaid) {
            this.price.set(0);
        } else {
            if (adaptedPayouts && adaptedPayouts.length === payoutRaw.length) {
                this.price.set(adaptedPayouts[this.rank() - 1]);
                this.winnerPrice.set(adaptedPayouts[0]);
            } else {
                const {totalPricePool} = this.totalPricePool();
                this.price.set(totalPricePool / 100 * payoutPercentage);
                this.winnerPrice.set(totalPricePool / 100 * payoutRaw[0]);
            }
        }
    }

    onSubmit(): void {
        const placesPaid = this.rankingService.getPayoutById(this.state.tournament().payout).length;
        const isBubble = this.rank() - placesPaid === 1;
        this.isLoadingAdd = true;

        const playerId = this.model.playerId();
        const eliminatedById = this.model.eliminatedBy();

        if (playerId && eliminatedById) {
            this.finishApiService.post$({
                playerId: playerId,
                tournamentId: this.state.tournament().id,
                price: this.price(),
                rank: this.rank(),
                timestamp: -1,
            }).pipe(
                take(1),
                catchError(() => {
                    this.notificationService.error('Error Seat Open');
                    this.isLoadingAdd = true;
                    return of(null);
                }),
                switchMap(() => this.postSeatOpenTEvent$(playerId)),
                switchMap(() => this.postElimination$(eliminatedById, playerId, this.state.tournament().id)),
                switchMap(() => iif(
                    () => this.rank() === 2,
                    defer(() => this.postRemainingFinish$()),
                    of(null)
                )),
                this.tournamentService.postActionEvent$,
                tap(() => this.closeDialogAfterSeatOpen(playerId, isBubble)),
            ).subscribe();
        }
    }

    private postSeatOpenTEvent$(playerId: number): Observable<ServerResponse | null> {
        const playerName = this.state.tournament().players.filter(e => e.id === playerId)[0].name;

        return this.tEventApiService.post$(
            this.state.tournament().id,
            `<strong>!!! SEAT OPEN !!!</strong> - <strong>${playerName}</strong> is out of the tournament!`,
            TEventType.SEAT_OPEN
        );
    }

    private postElimination$(eById: number, pId: number, tId: number): Observable<ServerResponse | null> {
        return this.eliminationApiService.post$({
            eliminator: eById,
            eliminated: pId,
            tournamentId: tId,
            timestamp: -1,
            eId: `F-${tId}-${pId}`
        }).pipe(
            switchMap(() => {
                const {eliminated, eliminator} = this.getInvolvedPlayerNames(pId, eById);

                return this.tEventApiService.post$(
                    this.state.tournament().id,
                    `<strong>${eliminated}</strong> was kicked out by <strong>${eliminator}</strong>!`,
                    TEventType.ELIMINATION
                );
            }),
            catchError(() => {
                this.notificationService.error('Error Elimination');
                this.isLoadingAdd = false;
                return of(null);
            })
        );
    }

    private getInvolvedPlayerNames(pId: number, eById: number): { eliminated: string, eliminator: string } {
        return {
            eliminated: this.playersToEliminate().filter(e => e.value === pId)[0].label,
            eliminator: this.playersToEliminate().filter(e => e.value === eById)[0].label
        };
    }

    private postRemainingFinish$(): Observable<any> {
        return this.finishApiService.post$(this.getRemainingFinish()).pipe(
            switchMap(() => {
                const winner: Finish = this.getRemainingFinish();
                const name = this.playersToEliminate().filter(e => e.value === winner.playerId)[0].label;

                return this.tEventApiService.post$(
                    this.state.tournament().id,
                    `<strong>FINISHED! ${name}</strong> wins the tournament and takes home ${winner.price}.-! Congratulations!`,
                    TEventType.FINISH
                );
            }),
        );
    }

    private getRemainingFinish(): Finish {
        const playerId = this.state.tournament().players.filter(
            (player: Player) => {
                const finishIds = this.state.tournament().finishes.map(f => f.playerId);

                return !finishIds.includes(player.id);
            }
        )[0].id;

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.state.tournament().id);
        const payouts = this.rankingService.getPayoutById(this.state.tournament().payout);
        const payoutPercentage = +payouts[0];

        let price = 0;

        if (adaptedPayouts) {
            price = adaptedPayouts[this.rank() - 2];
        } else {
            const {totalPricePool} = this.totalPricePool();
            price = totalPricePool / 100 * payoutPercentage;
        }

        return {
            rank: 1,
            tournamentId: this.state.tournament().id,
            price,
            playerId,
            timestamp: -1,
        };
    }

    private closeDialogAfterSeatOpen(playerId: number, isBubble: boolean): void {
        this.fetchService.trigger();

        if (this.dialogRef) {
            this.dialogRef.close({
                name: this.state.tournament().players.find(e => e.id === playerId)?.name,
                price: this.price(),
                isBubble: isBubble,
                rank: this.rank(),
                winnerName: this.rank() === 2 ? this.state.eligibleForSeatOpen().find(e => e.id !== playerId)?.name : '',
                winnerPrice: this.winnerPrice()
            });
        }
        this.isLoadingAdd = false;
    }

    removeSeatOpen(pId: number, playerName: string): void {
        this.isLoadingRemove = true;

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Remove Seat Open',
                    body: `Do you really want to remove the seat open of <strong>${playerName}</strong>`,
                    confirm: 'Remove Seat Open',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((result: boolean) => iif(
                    () => result,
                    defer(() => this.finishApiService.delete$(this.state.tournament().id, pId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Seat Open');
                                this.isLoadingRemove = false;
                                return of(null);
                            }),
                            tap(() => {
                                this.rank.update((current: number) => current + 1);
                            }),
                            switchMap(() => {
                                return this.tEventApiService.post$(
                                    this.state.tournament().id,
                                    `Oh no, There was a mistake! <strong>${playerName}</strong> is still in the tournament!!`,
                                    TEventType.CORRECTION
                                );
                            }),
                            switchMap(() => this.eliminationApiService.deleteByEId$(
                                `F-${this.state.tournament().id}-${pId}`
                            ).pipe(
                                catchError(() => {
                                    this.notificationService.error('Error removing Elimination');
                                    this.isLoadingRemove = false;
                                    return of(null);
                                })
                            )),
                            tap(() => {
                                this.fetchService.trigger();
                                //    this.isLoadingRemove = false;
                            }),
                            this.tournamentService.postActionEvent$
                        )
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();

        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }

}
