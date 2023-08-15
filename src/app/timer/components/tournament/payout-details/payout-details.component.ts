import { AfterViewInit, Component, inject, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { Player } from '../../../../shared/models/player.interface';
import { RankingService } from '../../../../core/services/util/ranking.service';
import { interval } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-payout-details',
    templateUrl: './payout-details.component.html',
    styleUrls: ['./payout-details.component.scss']
})
export class PayoutDetailsComponent implements OnChanges, AfterViewInit {

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

    deduction: number = 0;

    private rankingService: RankingService = inject(RankingService);

    payouts: {
        rank: number,
        percentage: string;
        price: number;
        image: string | undefined,
        name: string | undefined
    }[];

    totalPricePool: number;

    ngOnChanges(): void {
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

        payoutRaw.forEach((percentage: number) => {
            this.payouts.push({
                rank: index,
                percentage: `${percentage}%`,
                price: this.totalPricePool / 100 * percentage,
                name: mappedFinishes.find(f => f.rank === index)?.n,
                image: mappedFinishes.find(f => f.rank === index)?.i
            });

            index++;
        });
    }

    ngAfterViewInit(): void {
        let scrollDown = false;

        interval(3000).pipe(
            tap(() => {
                if (scrollDown) {
                    document.getElementById('bottomd')?.scrollIntoView({behavior: 'smooth'});
                } else {
                    document.getElementById('topd')?.scrollIntoView({behavior: 'smooth'});
                }

                scrollDown = !scrollDown;
            })
        ).subscribe();
    }

}
