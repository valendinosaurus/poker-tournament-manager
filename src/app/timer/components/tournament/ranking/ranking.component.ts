import { Component, inject, Input, OnChanges } from '@angular/core';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { Formula, RankingService } from '../../../../core/services/util/ranking.service';
import { Tournament } from '../../../../shared/models/tournament.interface';

@Component({
    selector: 'app-ranking',
    templateUrl: './ranking.component.html',
    styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() finishes: Finish[];
    @Input() tournament: Tournament;
    @Input() formulaId: number | null;

    private rankingService: RankingService = inject(RankingService);

    formula: Formula;

    combFinishes: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        addons: number;
    }[];

    missingRankes: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        addons: number;
    }[];

    ngOnChanges(): void {
        if (this.players && this.entries && this.finishes) {
            this.combFinishes = this.finishes.map(
                (finish: Finish) => ({
                    image: this.players.filter(p => p.id === finish.playerId)[0]?.image,
                    name: this.players.filter(p => p.id === finish.playerId)[0]?.name,
                    rank: finish.rank,
                    price: finish.price,
                    rebuys: this.entries.filter(e => e.playerId === finish.playerId && e.type === 'REBUY').length,
                    addons: this.entries.filter(e => e.playerId === finish.playerId && e.type === 'ADDON').length
                })
            ).sort((a, b) => a.rank - b.rank);

            const amountOfMissingRankes = this.players.length = this.finishes.length;

            console.log(amountOfMissingRankes);

            this.missingRankes = [];

            for (let i = 1; i <= amountOfMissingRankes; i++) {
                this.missingRankes.push({
                    rank: i,
                    addons: 0,
                    rebuys: 0,
                    name: '???',
                    image: 'https://friconix.com/jpg/fi-cnsuxx-question-mark.jpg',
                    price: 0
                });
            }
        }

        if (this.formulaId !== null) {
            this.formula = this.rankingService.getFormulaById(this.formulaId);
        }
    }

    calcPoints(combFinishe: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        addons: number;
    }): number {
        return this.formula({
            rank: +combFinishe.rank,
            addons: +combFinishe.addons,
            rebuys: +combFinishe.rebuys,
            players: this.tournament.players.length,
            buyIn: +this.tournament.buyIn,
            pricepool: +this.getPricePool(),
            addonCost: +this.tournament.addon
        });
    }

    private getPricePool(): number {
        return this.entries.filter(
                (entry: Entry) => entry.type !== 'ADDON'
            ).length * +this.tournament.buyIn
            + this.entries.filter(e => e.type === 'ADDON').length * +this.tournament.addon
            + +this.tournament.initialPricepool;
    }
}
