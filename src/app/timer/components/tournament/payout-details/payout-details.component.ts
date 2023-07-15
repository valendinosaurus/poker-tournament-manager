import { Component, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { Player } from '../../../../shared/models/player.interface';

@Component({
    selector: 'app-payout-details',
    templateUrl: './payout-details.component.html',
    styleUrls: ['./payout-details.component.scss']
})
export class PayoutDetailsComponent implements OnChanges {

    @Input() entries: Entry[];
    @Input() buyIn: number;
    @Input() addon: number;
    @Input() initialPricepool: number;
    @Input() payout: string;
    @Input() finishes: Finish[];
    @Input() players: Player[];

    payouts: {
        rank: number,
        percentage: string;
        price: number;
        image: string | undefined,
        name: string | undefined
    }[];

    totalPricepool: number;

    ngOnChanges(): void {
        this.payouts = [];

        const payoutRaw = this.payout.split(' ');

        this.totalPricepool = this.entries.filter(
                (entry: Entry) => entry.type !== 'ADDON'
            ).length * +this.buyIn
            + this.entries.filter(e => e.type === 'ADDON').length * +this.addon
            + +this.initialPricepool;

        let index = 1;

        const mappedFinishes: { n: string, i: string, rank: number }[] = this.finishes.map(
            f => ({
                rank: f.rank,
                i: this.players.find(p => p.id === f.playerId)?.image ?? '',
                n: this.players.find(p => p.id === f.playerId)?.name ?? ''
            })
        );

        payoutRaw.forEach((raw: string) => {
            const percentage = +raw;

            this.payouts.push({
                rank: index,
                percentage: `${percentage}%`,
                price: this.totalPricepool / 100 * percentage,
                name: mappedFinishes.find(f => f.rank === index)?.n,
                image: mappedFinishes.find(f => f.rank === index)?.i
            });

            index++;
        });
    }

}
