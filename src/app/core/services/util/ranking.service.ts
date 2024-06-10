import { inject, Injectable } from '@angular/core';
import { Entry } from '../../../shared/interfaces/entry.interface';
import { Tournament } from '../../../shared/interfaces/tournament.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';
import { TimerStateService } from '../../../timer/services/timer-state.service';

export type FormulaInput = {
    players: number,
    pricePool: number,
    rank: number,
    buyIn: number,
    reEntries: number,
    addons: number,
    rebuys: number,
    addonCost: number
}

export type Formula = (input: FormulaInput) => number;

@Injectable({
    providedIn: 'root'
})
export class RankingService {

    private state: TimerStateService = inject(TimerStateService);

    defaultFormula: Formula = (input: FormulaInput) => 0;

    defaultPayout = [50, 30, 20];

    payouts: { id: number, prices: number[] }[] = [
        {
            id: 0,
            prices: [
                50,
                30,
                20
            ]
        },
        {
            id: 1,
            prices: [
                40,
                30,
                20,
                10
            ]
        },
        {
            id: 2,
            prices: [
                30,
                25,
                20,
                15,
                10
            ]
        },
        {
            id: 3,
            prices: [
                70,
                30
            ]
        },
        {
            id: 4,
            prices: [
                30,
                22,
                18,
                15,
                8,
                5,
                2
            ]
        }
    ];

    formulas: { id: number, f: Formula, name: string, desc: string, imageUrl: string }[] = [
        {
            name: 'Very Simple',
            id: 1,
            f: (input: FormulaInput) => {
                return input.players - input.rank + 1;
            },
            desc: '#players - rank + 1',
            imageUrl: ''
        },
        {
            name: 'VPR with rebuy and addon',
            id: 0,
            f: (input: FormulaInput) => {
                const points = +input.pricePool
                    / Math.sqrt(+input.players * (1 + +input.reEntries + +input.rebuys + +input.addons)) / (1 + +input.rank);

                return points;
            },
            desc: '$\\frac{pricepool}{\\frac{\\sqrt(players * (1 + rebuys + addons)}{1 + rank}}$',
            imageUrl: 'assets/formula_VPR_rebuy_addon.png'
        }
    ];

    getFormulaById(id: number): Formula {
        const formula: { id: number, f: Formula } | undefined = this.formulas.find(ff => ff.id === id);

        return formula ? formula.f : this.defaultFormula;
    }

    getFormulasForSelect(): { label: string, value: number | null }[] {
        const formulas: { label: string, value: number | null }[] | undefined = this.formulas.map(ff => ({
            label: ff.name,
            value: ff.id
        }));

        return [
            {
                label: 'No Formula',
                value: null
            },
            ...formulas
        ];
    }

    getFormulaDesc(id: number | null | undefined): string {
        if (id === null || id === undefined) {
            return 'no description';
        }

        return this.formulas.find(f => f.id === id)?.desc ?? 'no description';
    }

    getPayoutById(id: number): number[] {
        const payout: { id: number, prices: number[] } | undefined = this.payouts.find(ff => ff.id === id);

        return payout ? payout.prices : this.defaultPayout;
    }

    getAllPayoutsForSelect(): { label: string, value: number }[] {
        return this.payouts.map(p => ({
            label: p.prices.join(' / '),
            value: p.id
        }));
    }

    getSimplePricePool(tournament: Tournament): number {
        const buyInsReEntries: number = tournament.entries.filter(
            (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
        ).length * tournament.buyInAmount;

        const rebuys: number = tournament.entries.filter(e => e.type === EntryType.REBUY).length * tournament.rebuyAmount;
        const addons: number = tournament.entries.filter(e => e.type === EntryType.ADDON).length * tournament.addonAmount;

        return buyInsReEntries + rebuys + addons + +tournament.initialPricePool;
    }

}
