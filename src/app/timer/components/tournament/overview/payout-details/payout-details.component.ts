import { Component, computed, DestroyRef, inject, OnInit, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/interfaces/entry.interface';
import { Finish } from '../../../../../shared/interfaces/finish.interface';
import { Player } from '../../../../../shared/interfaces/player.interface';
import { RankingService } from '../../../../../shared/services/util/ranking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ModifyPayoutComponent } from '../../../../../dialogs/modify-payout/modify-payout.component';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { ConfirmationDialogComponent } from '../../../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FetchService } from '../../../../../shared/services/fetch.service';
import { TimerStateService } from '../../../../services/timer-state.service';
import { Tournament } from '../../../../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../../../../shared/interfaces/series.interface';
import { defer, iif, of } from 'rxjs';
import { TournamentApiService } from '../../../../../shared/services/api/tournament-api.service';

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

    isAdaptedPayoutSumCorrect = computed(() =>
        this.tournament().adaptedPayout === undefined
            ? true
            : this.totalPricePool() === this.tournament().adaptedPayout?.reduce((p, c) => p + c, 0)
    );

    isPayoutAdapted = computed(() => this.tournament().adaptedPayout !== undefined);

    payouts: Signal<Payout[]>;
    wasDealMade: Signal<boolean>;
    playersLeft: Signal<number>;
    placesPaid: Signal<number>;

    private rankingService: RankingService = inject(RankingService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private fetchService: FetchService = inject(FetchService);
    private state: TimerStateService = inject(TimerStateService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    ngOnInit(): void {
        this.totalPricePool = this.state.totalPricePool;
        this.deduction = this.state.pricePoolDeduction;
        this.tournament = this.state.tournament;
        this.metadata = this.state.metadata;
        this.entries = this.state.entries;
        this.finishes = this.state.finishes;
        this.players = this.state.players;
        this.buyInAmount = computed(() => this.tournament().buyInAmount);
        this.rebuyAmount = computed(() => this.tournament().rebuyAmount);
        this.addonAmount = computed(() => this.tournament().addonAmount);
        this.initialPricePool = computed(() => this.tournament().initialPricePool);
        this.percentage = computed(() => this.metadata()?.percentage);
        this.maxCap = computed(() => this.metadata()?.maxAmountPerTournament);
        this.payout = computed(() => this.tournament().payout);
        const ranks = computed(() => this.finishes().map(f => f.rank));
        this.wasDealMade = computed(() =>
            this.finishes().filter(e => e.price > 0).length > 0
            && ranks().length !== new Set(ranks()).size
        );
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

        const adaptedPayouts: number[] | undefined = this.tournament().adaptedPayout; // this.localStorageService.getAdaptedPayoutById(this.tournament().id);

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
            tap(() => {
                this.fetchService.trigger();
            }),
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
            switchMap((result: boolean) => iif(
                () => result,
                defer(() => this.tournamentApiService.deleteAdaptedPayout(this.tournament().id).pipe(
                    tap(() => {
                        this.fetchService.trigger();
                    })
                )),
                of(null)
            )),
        ).subscribe();
    }

}
