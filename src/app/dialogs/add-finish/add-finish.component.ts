import { Component, computed, inject, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { RankingService } from '../../shared/services/util/ranking.service';
import { defer, iif, of } from 'rxjs';
import { NotificationService } from '../../shared/services/notification.service';
import { ConductedFinish } from '../../shared/interfaces/util/conducted-finish.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ConductedElimination } from '../../shared/interfaces/util/conducted-elimination.interface';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AddFinishModel } from './add-finish-model.interface';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FetchService } from '../../shared/services/fetch.service';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { DeleteSeatOpenEvent } from '../../shared/interfaces/util/seat-open-event.interface';
import { TimerApiService } from '../../shared/services/api/timer-api.service';
import { TournamentService } from '../../shared/services/util/tournament.service';

@Component({
    selector: 'app-add-finish',
    templateUrl: './add-finish.component.html',
    styleUrls: ['./add-finish.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf, NgFor, UserImageRoundComponent, DatePipe, AsyncPipe, MatFormFieldModule, MatSelectModule]
})
export class AddFinishComponent extends BaseAddDialogComponent<AddFinishComponent, AddFinishModel> implements OnInit {

    playersToEliminate: Signal<{ label: string, value: number }[]>;
    eliminators: Signal<{ label: string, value: number }[]>;
    conductedFinishes: Signal<ConductedFinish[]>;
    conductedEliminations: Signal<ConductedElimination[]>;
    totalPricePool: Signal<number>;

    rank: WritableSignal<number> = signal(0);
    price: WritableSignal<number> = signal(0);
    winnerPrice: WritableSignal<number> = signal(0);

    private rankingService: RankingService = inject(RankingService);
    private notificationService: NotificationService = inject(NotificationService);
    private dialog: MatDialog = inject(MatDialog);
    private state: TimerStateService = inject(TimerStateService);
    private fetchService: FetchService = inject(FetchService);
    private timerApiService: TimerApiService = inject(TimerApiService);
    private tournamentService: TournamentService = inject(TournamentService);

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
        this.playersToEliminate = this.state.playersToEliminate;
        this.conductedFinishes = this.state.conductedFinishes;
        this.conductedEliminations = this.state.conductedEliminations;
        this.totalPricePool = this.state.totalPricePool;

        this.eliminators = computed(() =>
            this.playersToEliminate().filter(p => p.value !== this.model.playerId())
        );
    }

    private calcRanksAndPrices(): void {
        this.rank.set(this.state.tournament().players.length - this.state.tournament().finishes.length);
        const payoutRaw = this.rankingService.getPayoutById(this.state.tournament().payout);
        const payoutPercentage = payoutRaw[this.rank() - 1];

        const adaptedPayouts: number[] | undefined = this.state.tournament().adaptedPayout;// this.localStorageService.getAdaptedPayoutById(this.state.tournament().id);
        const placesPaid = adaptedPayouts ? adaptedPayouts.length : payoutRaw.length;

        if (this.rank() > placesPaid) {
            this.price.set(0);
        } else {
            if (adaptedPayouts) {
                this.price.set(adaptedPayouts[this.rank() - 1]);
                this.winnerPrice.set(adaptedPayouts[0]);
            } else {
                this.price.set(this.totalPricePool() / 100 * payoutPercentage);
                this.winnerPrice.set(this.totalPricePool() / 100 * payoutRaw[0]);
            }
        }
    }

    onSubmit(): void {
        const adaptedPayout = this.state.tournament().adaptedPayout;

        const placesPaid = adaptedPayout !== undefined
            ? adaptedPayout.length
            : this.rankingService.getPayoutById(this.state.tournament().payout).length;

        const isBubble = this.rank() - placesPaid === 1;
        this.isLoadingAdd = true;

        const playerId = this.model.playerId();
        const eliminatedById = this.model.eliminatedBy();

        if (playerId && eliminatedById) {
            this.timerApiService.seatOpen$(this.tournamentService.getSeatOpenEvent(
                playerId,
                eliminatedById,
                this.price(),
                this.rank()
            )).pipe(
                take(1),
                tap(() => this.closeDialogAfterSeatOpen(playerId, isBubble)),
                catchError(() => {
                    this.notificationService.error('Error Seat Open');
                    this.isLoadingAdd = false;
                    return of(null);
                }),
            ).subscribe();
        }
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

        const deleteSeatOpenEvent: DeleteSeatOpenEvent = {
            tournamentId: this.state.tournament().id,
            clientId: this.state.clientId(),
            eliminatedId: pId,
            rank: -1,
            price: -1,
            eliminatorId: -1,
            eId: `F-${this.state.tournament().id}-${pId}`,
            messageFinish: `Oh no, There was a mistake! <strong>${playerName}</strong> is still in the tournament!!`,
            messageElimination: ''
        };

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
                    defer(() => this.timerApiService.deleteSeatOpen$(deleteSeatOpenEvent).pipe(
                            take(1),
                            tap(() => {
                                this.rank.update((current: number) => current + 1);
                                this.fetchService.trigger();
                                this.isLoadingRemove = false;
                            }),
                            catchError(() => {
                                this.notificationService.error('Error removing Seat Open');
                                this.isLoadingRemove = false;
                                return of(null);
                            }),
                        )
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

}
