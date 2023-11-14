import { Injectable } from '@angular/core';
import { AdaptedPayout } from '../../../shared/models/adapted-payout.interface';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    storeTournamentState(id: number, levelIndex: number, timeLeft: number): void {
        if (id !== -1) {
            localStorage.setItem(
                id.toString(),
                JSON.stringify({
                    levelIndex: +levelIndex,
                    timeLeft: +timeLeft
                })
            );
        }
    }

    getTournamentStateById(id: number): { levelIndex: number, timeLeft: number } | undefined {
        const item = localStorage.getItem(id.toString());

        if (item) {
            const parsed: { levelIndex: number, timeLeft: number } = JSON.parse(item);

            return parsed;
        }

        return undefined;
    }

    storeAdaptedPayout(adaptedPayout: AdaptedPayout): void {
        if (adaptedPayout.tournamentId && adaptedPayout.tournamentId > -1) {
            localStorage.setItem(`ADAPTED_FINISH_${adaptedPayout.tournamentId}`, JSON.stringify(adaptedPayout.payouts));
        }
    }

    getAdaptedPayoutById(tId: number): number[] | undefined {
        const item = localStorage.getItem(`ADAPTED_FINISH_${tId}`);

        if (item) {
            const parsed: number[] = JSON.parse(item);

            return parsed;
        }

        return undefined;
    }

}
