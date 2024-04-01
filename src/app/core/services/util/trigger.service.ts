import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TriggerService {

    triggerTournaments$ = new ReplaySubject<void>();
    triggerSeries$ = new ReplaySubject<void>();
    triggerPlayers$ = new ReplaySubject<void>();
    triggerBlinds$ = new ReplaySubject<void>();

    triggerSeriess(): void {
        this.triggerSeries$.next();
    }

    getSeriesTrigger$(): Observable<void> {
        return this.triggerSeries$.asObservable();
    }

    triggerTournaments(): void {
        this.triggerTournaments$.next();
    }

    getTournamentsTrigger$(): Observable<void> {
        return this.triggerTournaments$.asObservable();
    }

    triggerPlayers(): void {
        this.triggerPlayers$.next();
    }

    getPlayersTrigger$(): Observable<void> {
        return this.triggerPlayers$.asObservable();
    }

    triggerBlinds(): void {
        this.triggerBlinds$.next();
    }

    getBlindsTrigger$(): Observable<void> {
        return this.triggerBlinds$.asObservable();
    }

}
