import { Injectable } from '@angular/core';
import { AdaptedPayout } from '../../../shared/models/util/adapted-payout.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableDraw } from '../../../shared/models/table-draw.interface';

export interface LocalSettings {
    autoSlide: boolean;
    showCondensedBlinds: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    localSettings: LocalSettings = this.getLocalSettings();
    showCondensedBlinds$ = new BehaviorSubject<boolean>(this.localSettings.showCondensedBlinds);

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

    deleteAdaptedPayout(tId: number): void {
        localStorage.removeItem(`ADAPTED_FINISH_${tId}`);
    }

    getLocalSettings(): LocalSettings {
        const settingsFromLocalStorage = localStorage.getItem('LOCAL_SETTINGS');

        if (settingsFromLocalStorage) {
            return JSON.parse(settingsFromLocalStorage);
        } else {
            return {
                autoSlide: true,
                showCondensedBlinds: false
            };
        }
    }

    saveLocalAutoSlide(autoSlide: boolean) {
        const settings = this.getLocalSettings();
        localStorage.setItem('LOCAL_SETTINGS', JSON.stringify({
            ...settings,
            autoSlide
        }));
    }

    saveShowCondensedBlinds(showCondensedBlinds: boolean) {
        const settings = this.getLocalSettings();
        localStorage.setItem('LOCAL_SETTINGS', JSON.stringify({
            ...settings,
            showCondensedBlinds
        }));

        this.showCondensedBlinds$.next(showCondensedBlinds);
    }

    getShowCondensedBlinds$(): Observable<boolean> {
        return this.showCondensedBlinds$.asObservable();
    }

    saveTableDraw(tableDraw: TableDraw): void {
        localStorage.setItem(`TABLE-DRAW-${tableDraw.tournament.id}`, JSON.stringify(tableDraw));
    }

    resetTableDraw(tId: number): void {
        localStorage.removeItem(`TABLE-DRAW-${tId}`);
    }

    getTableDraw(tId: number): TableDraw {
        const tableDraw = localStorage.getItem(`TABLE-DRAW-${tId}`);

        return tableDraw ? JSON.parse(tableDraw) : undefined;
    }

}
