import { Injectable } from '@angular/core';

export type FormulaInput = {
    players: number,
    pricepool: number,
    rank: number,
    buyIn: number,
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

    //Points = 10 * SQRT(Players / Rank) * (1 + LOG(Prizemoney / Players + 0.25))^2 / (1 + LOG(Buy-in + Rebuys + Add-ons + 0.25))

    formulas: { id: number, f: Formula }[] = [
        {
            id: 1,
            f: (input: FormulaInput) => {
                return input.players - input.rank + 1;
            }
        },
        {
            id: 2,
            f: (input: FormulaInput) => {
                const points = 10
                    * Math.sqrt(input.players / input.rank)
                    * Math.pow(1 + Math.log(+input.pricepool / input.players + 0.25), 2)
                    / (1 + Math.log(+input.buyIn + +input.rebuys * +input.buyIn + input.addons + 0.25));

                return Math.round(points);
            }
        },
        {
            id: 0,
            f: (input: FormulaInput) => {
                const points = +input.pricepool
                    / Math.sqrt(+input.players * (1 + +input.rebuys + +input.addons)) / (1 + +input.rank);

                return Math.round(points);
            }
        }
    ];

    getFormulaById(id: number): Formula {
        const formula: { id: number, f: Formula } | undefined = this.formulas.find(ff => ff.id === id);

        return formula ? formula.f : this.defaultFormula;
    }

}
