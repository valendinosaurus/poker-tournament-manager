import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { Formula, RankingService } from '../../../../../core/services/util/ranking.service';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { BulletsComponent } from '../../../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';

interface Ranking {
    image: string;
    name: string;
    rank: number;
    price: number;
    rebuys: number;
    addons: number;
    reEntries: number;
};

@Component({
    selector: 'app-ranking',
    templateUrl: './ranking.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [
        NgIf,
        NgFor,
        UserImageRoundComponent,
        BulletsComponent,
        DecimalPipe,
    ],
})
export class RankingComponent implements OnInit {

    formula: Formula;

    combFinishes: Signal<Ranking[]>;
    missingRanks: Signal<Ranking[]>;

    private rankingService: RankingService = inject(RankingService);
    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        const tournament = computed(() => this.state.tournament());
        const metadata = computed(() => this.state.metadata());
        const players = computed(() => this.state.tournament().players);
        const entries = computed(() => this.state.tournament().entries);
        const finishes = computed(() => this.state.tournament().finishes);

        this.combFinishes = computed(() => finishes().map(
            (finish: Finish) => ({
                image: players().filter(p => p.id === finish.playerId)[0]?.image,
                name: players().filter(p => p.id === finish.playerId)[0]?.name,
                rank: finish.rank,
                price: finish.price,
                rebuys: entries().filter(e => e.playerId === finish.playerId && e.type === EntryType.REBUY).length,
                addons: entries().filter(e => e.playerId === finish.playerId && e.type === EntryType.ADDON).length,
                reEntries: entries().filter(e => e.playerId === finish.playerId && e.type === EntryType.RE_ENTRY).length,
            })
        ).sort((a, b) => a.rank - b.rank));

        const amountOfMissingRanks = computed(() => players().length - finishes().length);

        this.missingRanks = computed(() => {
            const missingRanks: Ranking[] = [];

            for (let i = 1; i <= amountOfMissingRanks(); i++) {
                missingRanks.push({
                    rank: i,
                    addons: 0,
                    rebuys: 0,
                    reEntries: 0,
                    name: '???',
                    image: 'https://friconix.com/jpg/fi-cnsuxx-question-mark.jpg',
                    price: 0
                });
            }

            return missingRanks;
        });

        let formula = undefined;

        if (tournament().rankFormula) {
            formula = tournament().rankFormula;
        } else {
            if (metadata()?.rankFormula !== undefined && metadata()?.rankFormula !== null) {
                formula = metadata()?.rankFormula;
            }
        }

        if (formula) {
            this.formula = this.rankingService.getFormulaById(formula);
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
            players: this.state.tournament().players.length,
            buyIn: +this.state.tournament().buyInAmount,
            pricePool: +this.getPricePool(),
            addonCost: +this.state.tournament().addonAmount
        }) : 0;
    }

    private getPricePool(): number {
        return this.state.tournament().entries.filter(
                (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
            ).length * +this.state.tournament().buyInAmount
            + this.state.tournament().entries.filter(e => e.type === EntryType.REBUY).length * +this.state.tournament().rebuyAmount
            + this.state.tournament().entries.filter(e => e.type === EntryType.ADDON).length * +this.state.tournament().addonAmount
            + +this.state.tournament().initialPricePool;
    }
}
