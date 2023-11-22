import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { Formula, RankingService } from '../../../../../core/services/util/ranking.service';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../../../../shared/models/series-metadata.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';

@Component({
    selector: 'app-ranking',
    templateUrl: './ranking.component.html',
    styles: [':host{display: contents}'],
})
export class RankingComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() seriesMetadata: SeriesMetadata | null;
    @Input() finishes: Finish[];
    @Input() tournament: Tournament;
    @Input() trigger: string | null;

    private rankingService: RankingService = inject(RankingService);

    formula: Formula;

    combFinishes: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        addons: number;
        reEntries: number;
    }[];

    missingRankes: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        addons: number;
        reEntries: number;
    }[];

    scrollDown = true;

    ngOnChanges(changes: SimpleChanges): void {
        if (this.players && this.entries && this.finishes) {
            this.combFinishes = this.finishes.map(
                (finish: Finish) => ({
                    image: this.players.filter(p => p.id === finish.playerId)[0]?.image,
                    name: this.players.filter(p => p.id === finish.playerId)[0]?.name,
                    rank: finish.rank,
                    price: finish.price,
                    rebuys: this.entries.filter(e => e.playerId === finish.playerId && e.type === EntryType.REBUY).length,
                    addons: this.entries.filter(e => e.playerId === finish.playerId && e.type === EntryType.ADDON).length,
                    reEntries: this.entries.filter(e => e.playerId === finish.playerId && e.type === EntryType.RE_ENTRY).length,
                })
            ).sort((a, b) => a.rank - b.rank);

            const amountOfMissingRanks = this.players.length - this.finishes.length;

            this.missingRankes = [];

            for (let i = 1; i <= amountOfMissingRanks; i++) {
                this.missingRankes.push({
                    rank: i,
                    addons: 0,
                    rebuys: 0,
                    reEntries: 0,
                    name: '???',
                    image: 'https://friconix.com/jpg/fi-cnsuxx-question-mark.jpg',
                    price: 0
                });
            }
        }

        let formula = undefined;

        if (this.tournament.rankFormula) {
            formula = this.tournament.rankFormula;
        } else {
            if (this.seriesMetadata?.rankFormula !== undefined && this.seriesMetadata?.rankFormula !== null) {
                formula = this.seriesMetadata.rankFormula;
            }
        }

        if (formula) {
            this.formula = this.rankingService.getFormulaById(formula);
        }

        if (changes['trigger']?.currentValue === 'SCROLL') {
            if (this.scrollDown) {
                document.getElementById('bottomr')?.scrollIntoView({behavior: 'smooth'});
            } else {
                document.getElementById('topr')?.scrollIntoView({behavior: 'smooth'});
            }

            this.scrollDown = !this.scrollDown;
        }
    }

    calcPoints(combFinishe: {
        image: string;
        name: string;
        rank: number;
        price: number;
        rebuys: number;
        reEntries: number;
        addons: number;
    }): number {
        return this.formula ? this.formula({
            rank: +combFinishe.rank,
            reEntries: +combFinishe.reEntries,
            addons: +combFinishe.addons,
            rebuys: +combFinishe.rebuys,
            players: this.tournament.players.length,
            buyIn: +this.tournament.buyInAmount,
            pricePool: +this.getPricePool(),
            addonCost: +this.tournament.addonAmount
        }) : 0;
    }

    private getPricePool(): number {
        return this.entries.filter(
                (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
            ).length * +this.tournament.buyInAmount
            + this.entries.filter(e => e.type === EntryType.REBUY).length * +this.tournament.rebuyAmount
            + this.entries.filter(e => e.type === EntryType.ADDON).length * +this.tournament.addonAmount
            + +this.tournament.initialPricePool;
    }
}
