import { Injectable } from '@angular/core';
import { Entry } from '../../../shared/models/entry.interface';

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
        }
    ];

    formulas: { id: number, f: Formula, name: string }[] = [
        {
            name: 'Very Simple',
            id: 1,
            f: (input: FormulaInput) => {
                return input.players - input.rank + 1;
            }
        },
        {
            name: 'VPR with rebuy and addon',
            id: 0,
            f: (input: FormulaInput) => {
                const points = +input.pricePool
                    / Math.sqrt(+input.players * (1 + +input.reEntries + +input.rebuys + +input.addons)) / (1 + +input.rank);

                return Math.round(points);
            }
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

    getTotalPricePool(
        entries: Entry[],
        buyInAmount: number,
        rebuyAmount: number,
        addonAmount: number,
        initialPricePool: number,
        percentage: number | undefined | null,
        maxCap: number | undefined | null
    ): {
        totalPricePool: number,
        deduction: number
    } {
        const temp = entries.filter(
                    (entry: Entry) => entry.type === 'ENTRY' || entry.type === 'RE-ENTRY'
                ).length * +buyInAmount
                + entries.filter(e => e.type === 'REBUY').length * +rebuyAmount
                + entries.filter(e => e.type === 'ADDON').length * +addonAmount
                + +initialPricePool
        ;

        const reductionFull = temp * (percentage ? (percentage / 100) : 0);
        const deduction = ((reductionFull > (maxCap ?? reductionFull) ? maxCap : reductionFull) ?? 0);

        const totalPricePool = temp - deduction;

        return {
            totalPricePool,
            deduction
        };
    }

}
