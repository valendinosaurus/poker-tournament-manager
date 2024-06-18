export type FormulaInput = {
    players: number,
    pricePool: number,
    rank: number,
    buyIn: number,
    reEntries: number,
    addons: number,
    rebuys: number,
    addonCost: number,
    price: number
}

export type Formula = (input: FormulaInput) => number;
