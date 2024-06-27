import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { Finish } from '../../../../../shared/interfaces/finish.interface';
import { RankingService } from '../../../../../shared/services/util/ranking.service';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { BulletsComponent } from '../../../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';
import { FormulaPointsPipe } from '../../../../../shared/pipes/formula-points.pipe';
import { Ranking } from '../../../../../series/interfaces/ranking.interface';
import { Formula } from '../../../../../shared/interfaces/formula-input.type';
import { UserWithImageComponent } from '../../../../../shared/components/user-with-image/user-with-image.component';

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
        FormulaPointsPipe,
        UserWithImageComponent,
    ],
})
export class RankingComponent implements OnInit {

    formula: Formula;

    ranking: Signal<Ranking[]>;
    missingRanks: Signal<Ranking[]>;

    withRebuy = computed(() => this.state.tournament().withRebuy);
    withAddon = computed(() => this.state.tournament().withAddon);
    withReEntry = computed(() => this.state.tournament().withReEntry);

    private rankingService: RankingService = inject(RankingService);
    private state: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        const tournament = computed(() => this.state.tournament());
        const metadata = computed(() => this.state.metadata());
        const players = computed(() => this.state.tournament().players);
        const entries = computed(() => this.state.tournament().entries);
        const finishes = computed(() => this.state.tournament().finishes);

        this.ranking = computed(() => finishes().map(
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

        const metaFormula = metadata()?.rankFormula?.formula;

        if (metaFormula) {
            this.formula = eval(metaFormula);
        } else {
            const tournamentFormula = tournament().rankFormula?.formula;

            if (tournamentFormula) {
                this.formula = eval(tournamentFormula);
            }
        }
    }

}
