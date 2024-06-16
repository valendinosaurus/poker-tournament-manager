import { Injectable } from '@angular/core';
import { TableDraw } from '../../interfaces/table-draw.interface';

export interface LocalSettings {
    autoSlide: boolean;
    showCondensedBlinds: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    localSettings: LocalSettings = this.getLocalSettings();

    storeTournamentStarted(id: number, date: Date): void {
        localStorage.setItem(`STARTED_${id}`, date.toString());
    }

    getTournamentStarted(id: number): Date | undefined {
        const item = localStorage.getItem(`STARTED_${id}`);

        if (item) {
            return new Date(item);
        }

        return undefined;
    }

    resetTournamentStarted(id: number): void {
        localStorage.removeItem(`STARTED_${id}`);
    }

    storeTournamentState(
        id: number,
        levelIndex: number,
        timeLeft: number
    ): void {
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

    deleteTournamentState(tId: number): void {
        localStorage.removeItem(tId.toString());
    }

    getTournamentStateById(id: number): { levelIndex: number, timeLeft: number } | undefined {
        const item = localStorage.getItem(id.toString());

        if (item) {
            const parsed: { levelIndex: number, timeLeft: number } = JSON.parse(item);

            return parsed;
        }

        return undefined;
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
