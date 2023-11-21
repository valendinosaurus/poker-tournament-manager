import { Component, DestroyRef, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { Player } from '../../../../../shared/models/player.interface';
import { RankingService } from '../../../../../core/services/util/ranking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ModifyPayoutComponent } from '../../../../../dialogs/modify-payout/modify-payout.component';
import { LocalStorageService } from '../../../../../core/services/util/local-storage.service';

@Component({
    selector: 'app-payout-details',
    templateUrl: './payout-details.component.html',
    styleUrls: ['./payout-details.component.scss']
})
export class PayoutDetailsComponent implements OnChanges {

    @Input() tournamentId: number;
    @Input() entries: Entry[];
    @Input() buyInAmount: number;
    @Input() rebuyAmount: number;
    @Input() addonAmount: number;
    @Input() initialPricePool: number;
    @Input() percentage: number | null | undefined;
    @Input() maxCap: number | null | undefined;
    @Input() payout: number;
    @Input() finishes: Finish[];
    @Input() players: Player[];
    @Input() trigger: string | null;

    deduction: number = 0;

    private rankingService: RankingService = inject(RankingService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    payouts: {
        rank: number,
        percentage: string;
        price: number;
        image: string | undefined,
        name: string | undefined,
        dealMade: boolean
    }[];

    totalPricePool: number;
    scrollDown = true;
    wasDealMade = false;
    playersLeft: number;
    placesPaid: number;

    ngOnChanges(changes: SimpleChanges): void {
        const ranks = this.finishes.map(f => f.rank);
        this.wasDealMade = ranks.length !== new Set(ranks).size;
        this.playersLeft = this.entries.filter(e => e.type === 'ENTRY').length - this.finishes.length;
        this.placesPaid = this.rankingService.getPayoutById(this.payout).length;

        if (this.wasDealMade) {
            this.calculateAfterDeal();
        } else {
            this.calculateRegularList();
        }

        if (changes['trigger']?.currentValue === 'SCROLL') {
            if (this.scrollDown) {
                document.getElementById('bottomd')?.scrollIntoView({behavior: 'smooth'});
            } else {
                document.getElementById('topd')?.scrollIntoView({behavior: 'smooth'});
            }

            this.scrollDown = !this.scrollDown;
        }
    }

    private calculateRegularList(): void {
        this.payouts = [];

        const payoutRaw = this.rankingService.getPayoutById(this.payout);

        const {totalPricePool, deduction} = this.rankingService.getTotalPricePool(
            this.entries,
            this.buyInAmount,
            this.rebuyAmount,
            this.addonAmount,
            this.initialPricePool,
            this.percentage,
            this.maxCap
        );

        this.totalPricePool = totalPricePool;
        this.deduction = deduction;

        let index = 1;

        const mappedFinishes: { n: string, i: string, rank: number }[] = this.finishes.map(
            f => ({
                rank: f.rank,
                i: this.players.find(p => p.id === f.playerId)?.image ?? '',
                n: this.players.find(p => p.id === f.playerId)?.name ?? ''
            })
        );

        console.log(mappedFinishes);

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.tournamentId);

        if (adaptedPayouts && adaptedPayouts.length === payoutRaw.length) {
            adaptedPayouts.forEach((payout: number) => {
                this.payouts.push({
                    rank: index,
                    percentage: `${Math.floor(payout / this.totalPricePool * 100)}%`,
                    price: payout,
                    name: mappedFinishes.find(f => +f.rank === index)?.n,
                    image: mappedFinishes.find(f => +f.rank === index)?.i,
                    dealMade: false
                });

                index++;
            });
        } else {
            payoutRaw.forEach((percentage: number) => {
                this.payouts.push({
                    rank: index,
                    percentage: `${percentage}%`,
                    price: this.totalPricePool / 100 * percentage,
                    name: mappedFinishes.find(f => +f.rank === index)?.n,
                    image: mappedFinishes.find(f => +f.rank === index)?.i,
                    dealMade: false
                });

                index++;
            });
        }

        console.log(this.payouts);
    }

    private calculateAfterDeal(): void {
        this.payouts = [];

        const {totalPricePool, deduction} = this.rankingService.getTotalPricePool(
            this.entries,
            this.buyInAmount,
            this.rebuyAmount,
            this.addonAmount,
            this.initialPricePool,
            this.percentage,
            this.maxCap
        );

        this.totalPricePool = totalPricePool;
        this.deduction = deduction;

        const mappedFinishes: { n: string, i: string, rank: number, price: number }[] =
            this.finishes.map(
                f => ({
                    rank: f.rank,
                    i: this.players.find(p => p.id === f.playerId)?.image ?? '',
                    n: this.players.find(p => p.id === f.playerId)?.name ?? '',
                    price: f.price
                })
            );

        const rankOfDeal = Math.min(...this.finishes.map(f => f.rank));

        mappedFinishes.forEach((m) => {
            this.payouts.push({
                rank: m.rank,
                percentage: m.price > 0 ? `${(m.price / this.totalPricePool * 100).toFixed(1)}%` : '',
                price: m.price,
                name: m.n,
                image: m.i,
                dealMade: +m.rank === rankOfDeal
            });
        });

        this.payouts.sort((a, b) => a.rank - b.rank);
    }

    editPayouts(): void {
        const dialogRef = this.dialog.open(ModifyPayoutComponent, {
            position: {
                top: '40px'
            },
            data: {
                pricepool: this.payouts.map(e => e.price).reduce((p, c) => p + c, 0),
                payouts: this.payouts.map(e => e.price),
                tId: this.tournamentId
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                this.ngOnChanges({});

            }),
        ).subscribe();
    }

}
