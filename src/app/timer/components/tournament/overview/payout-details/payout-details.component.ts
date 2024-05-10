import { Component, computed, DestroyRef, inject, OnInit, signal, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { Player } from '../../../../../shared/models/player.interface';
import { RankingService } from '../../../../../core/services/util/ranking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ModifyPayoutComponent } from '../../../../../dialogs/modify-payout/modify-payout.component';
import { LocalStorageService } from '../../../../../core/services/util/local-storage.service';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { ConfirmationDialogComponent } from '../../../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FetchService } from '../../../../../core/services/fetch.service';
import { TimerStateService } from '../../../../services/timer-state.service';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../../../../shared/models/series.interface';

interface Payout {
    rank: number,
    percentage: string;
    price: number;
    image: string | undefined,
    name: string | undefined,
    dealMade: boolean
}

@Component({
    selector: 'app-payout-details',
    templateUrl: './payout-details.component.html',
    styleUrls: ['./payout-details.component.scss'],
    standalone: true,
    imports: [NgIf, MatButtonModule, MatTooltipModule, NgFor, UserImageRoundComponent, DecimalPipe]
})
export class PayoutDetailsComponent implements OnInit {

//    @Input() tournamentId: number;

    tournament: Signal<Tournament>;
    metadata: Signal<SeriesMetadata | undefined>;
    entries: Signal<Entry[]>;
    finishes: Signal<Finish[]>;
    players: Signal<Player[]>;
    buyInAmount: Signal<number>;
    rebuyAmount: Signal<number>;
    addonAmount: Signal<number>;
    initialPricePool: Signal<number>;
    percentage: Signal<number | null | undefined>;
    maxCap: Signal<number | null | undefined>;
    payout: Signal<number>;
    totalPricePool: Signal<number>;
    deduction: Signal<number>;

    isPayoutAdapted = signal(false);
    isAdaptedPayoutSumCorrect = signal(true);

    private rankingService: RankingService = inject(RankingService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private fetchService: FetchService = inject(FetchService);
    private timerStateService: TimerStateService = inject(TimerStateService);

    payouts: Signal<Payout[]>;
    wasDealMade: Signal<boolean>;
    playersLeft: Signal<number>;
    placesPaid: Signal<number>;

    ngOnInit(): void {
        this.totalPricePool = this.timerStateService.totalPricePool;
        this.deduction = this.timerStateService.pricePoolDeduction;
        this.tournament = this.timerStateService.tournament;
        this.metadata = this.timerStateService.metadata;
        this.entries = this.timerStateService.entries;
        this.finishes = this.timerStateService.finishes;
        this.players = this.timerStateService.players;
        this.buyInAmount = computed(() => this.tournament().buyInAmount);
        this.rebuyAmount = computed(() => this.tournament().rebuyAmount);
        this.addonAmount = computed(() => this.tournament().addonAmount);
        this.initialPricePool = computed(() => this.tournament().initialPricePool);
        this.percentage = computed(() => this.metadata()?.percentage);
        this.maxCap = computed(() => this.metadata()?.maxAmountPerTournament);
        this.payout = computed(() => this.tournament().payout);
        const ranks = computed(() => this.finishes().map(f => f.rank));
        this.wasDealMade = computed(() => ranks().length !== new Set(ranks()).size);
        this.playersLeft = computed(() => this.entries().filter(e => e.type === EntryType.ENTRY).length - this.finishes().length);
        this.placesPaid = computed(() => this.rankingService.getPayoutById(this.payout()).length);

        this.startCalculation();
    }

    private startCalculation(): void {
        this.payouts = computed(() => {
            if (this.wasDealMade()) {
                return this.calculateAfterDeal();
            } else {
                return this.calculateRegularList();
            }
        });

        const adaptedPayouts: Signal<number[] | undefined> = computed(
            () => this.localStorageService.getAdaptedPayoutById(this.tournament().id)
        );

        if (adaptedPayouts()) {
            const adaptedSum = adaptedPayouts()?.reduce((p, c) => p + c, 0);
            this.isAdaptedPayoutSumCorrect.set(this.totalPricePool() === adaptedSum);
            this.isPayoutAdapted.set(true);
        } else {
            this.isAdaptedPayoutSumCorrect.set(true);
            this.isPayoutAdapted.set(false);
        }
    }

    private calculateRegularList(): Payout[] {
        const payouts: Payout[] = [];
        const payoutRaw = this.rankingService.getPayoutById(this.payout());
        let index = 1;

        const mappedFinishes: { n: string, i: string, rank: number }[] = this.finishes().map(
            f => ({
                rank: f.rank,
                i: this.players().find(p => p.id === f.playerId)?.image ?? '',
                n: this.players().find(p => p.id === f.playerId)?.name ?? ''
            })
        );

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.tournament().id);

        if (adaptedPayouts) {
            adaptedPayouts.forEach((payout: number) => {
                payouts.push({
                    rank: index,
                    percentage: `${Math.floor(payout / this.totalPricePool() * 100)}%`,
                    price: payout,
                    name: mappedFinishes.find(f => +f.rank === index)?.n,
                    image: mappedFinishes.find(f => +f.rank === index)?.i,
                    dealMade: false
                });

                index++;
            });
        } else {
            payoutRaw.forEach((percentage: number) => {
                payouts.push({
                    rank: index,
                    percentage: `${percentage}%`,
                    price: this.totalPricePool() / 100 * percentage,
                    name: mappedFinishes.find(f => +f.rank === index)?.n,
                    image: mappedFinishes.find(f => +f.rank === index)?.i,
                    dealMade: false
                });

                index++;
            });
        }

        return payouts;
    }

    private calculateAfterDeal(): Payout[] {
        const payouts: Payout[] = [];

        const mappedFinishes: { n: string, i: string, rank: number, price: number }[] =
            this.finishes().map(
                f => ({
                    rank: f.rank,
                    i: this.players().find(p => p.id === f.playerId)?.image ?? '',
                    n: this.players().find(p => p.id === f.playerId)?.name ?? '',
                    price: f.price
                })
            );

        const rankOfDeal = Math.min(...this.finishes().map(f => f.rank));

        mappedFinishes.forEach((m) => {
            payouts.push({
                rank: m.rank,
                percentage: m.price > 0 ? `${(m.price / this.totalPricePool() * 100).toFixed(1)}%` : '',
                price: m.price,
                name: m.n,
                image: m.i,
                dealMade: +m.rank === rankOfDeal
            });
        });

        payouts.sort((a, b) => a.rank - b.rank);

        return payouts;
    }

    editPayouts(): void {
        const dialogRef = this.dialog.open(ModifyPayoutComponent, {
            position: {
                top: '40px'
            },
            data: {
                pricepool: this.totalPricePool(),
                payouts: this.payouts().map(e => e.price),
                tId: this.tournament().id,
                finishes: this.finishes(),
                players: this.players()
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.fetchService.trigger()),
        ).subscribe();
    }

    removeAdaptedPayouts(): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Reset Adapted Payouts',
                    body: `Do you really want to reset the adapted payouts?`,
                    confirm: 'Reset'
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            tap((result: boolean) => {
                if (result) {
                    this.localStorageService.deleteAdaptedPayout(this.tournament().id);
                    this.fetchService.trigger();
                }
            })
        ).subscribe();
    }

}
