import { inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { TimerStateService } from '../../timer/services/timer-state.service';
import { BroadcastAction } from '../interfaces/broadcast-event.interface';
import { WebSocketService } from './web-socket.service';

@Injectable({
    providedIn: 'root'
})
export class FetchService implements OnDestroy {

    channel = new BroadcastChannel('local-channel');

    private readonly fetchTrigger$ = new ReplaySubject<void>();
    private readonly resetTrigger$ = new ReplaySubject<void>();

    private webSocketService: WebSocketService = inject(WebSocketService);
    private state: TimerStateService = inject(TimerStateService);

    getFetchTrigger$(): Observable<void> {
        return this.fetchTrigger$.asObservable();
    }

    trigger(skipWSEmission = false): void {
        this.fetchTrigger$.next();

        if (!skipWSEmission) {
            this.webSocketService.send({
                senderUuid: this.state.uuid(),
                tournamentId: this.state.tournament().id,
                action: BroadcastAction.UPDATE,
                data: null
            });
        }
    }

    getResetTrigger$(): Observable<void> {
        return this.resetTrigger$.asObservable();
    }

    triggerReset(): void {
        this.resetTrigger$.next();
    }

    ngOnDestroy(): void {
        this.channel.close();
    }
}
