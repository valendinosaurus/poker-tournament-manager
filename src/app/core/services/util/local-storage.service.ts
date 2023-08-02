import { Injectable } from '@angular/core';

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

}
