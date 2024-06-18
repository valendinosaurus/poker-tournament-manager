import { inject, Pipe, PipeTransform } from '@angular/core';
import { Ranking } from '../../series/interfaces/ranking.interface';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { Entry } from '../interfaces/entry.interface';
import { EntryType } from '../enums/entry-type.enum';
import { Formula } from '../interfaces/formula-input.type';

@Pipe({
    name: 'formulaPoints',
    standalone: true
})
export class FormulaPointsPipe implements PipeTransform {

    private state: TimerStateService = inject(TimerStateService);

    transform(ranking: Ranking, formula: Formula): number {
        return formula({
            rank: +ranking.rank,
            price: +ranking.price,
            reEntries: +ranking.reEntries,
            addons: +ranking.addons,
            rebuys: +ranking.rebuys,
            players: this.state.tournament().players.length,
            buyIn: +this.state.tournament().buyInAmount,
            pricePool: +this.getPricePool(),
            addonCost: +this.state.tournament().addonAmount
        });
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
