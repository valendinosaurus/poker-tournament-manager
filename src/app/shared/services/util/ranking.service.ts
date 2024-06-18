import { inject, Injectable } from '@angular/core';
import { Entry } from '../../interfaces/entry.interface';
import { Tournament } from '../../interfaces/tournament.interface';
import { EntryType } from '../../enums/entry-type.enum';
import { RankFormulaApiService } from '../api/rank-formula-api.service';
import { Observable } from 'rxjs';
import { RankFormula } from '../../interfaces/rank-formula.interface';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RankingService {

    defaultPayout = [50, 30, 20];

    private rankFormulaApiService: RankFormulaApiService = inject(RankFormulaApiService);

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

    getFormulasForSelect$(): Observable<{ label: string, value: number | null }[]> {
        return this.rankFormulaApiService.getAll$().pipe(
            map((formulas: RankFormula[]) => [
                {
                    label: 'No Formula',
                    value: null
                },
                ...formulas.map(f => ({
                    label: f.name,
                    value: f.id
                }))
            ]),
            shareReplay(1)
        );
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
