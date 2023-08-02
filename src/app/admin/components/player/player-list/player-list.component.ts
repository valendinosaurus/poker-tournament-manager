import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../../../../shared/models/player.interface';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent implements OnInit {

    players$: Observable<Player[]>;
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private triggerService: TriggerService = inject(TriggerService);

    ngOnInit(): void {
        this.players$ = this.triggerService.getPlayersTrigger$().pipe(
            switchMap(() => this.playerApiService.getAll$().pipe(
                map((players) => players.map(t => ({
                    ...t,
                    finishes: [],
                    structure: []
                })))
            )),
            shareReplay(1)
        );
    }

    deletePlayer(playerId: number | undefined): void {
        if (playerId) {
            this.playerApiService.delete$(playerId).pipe(
                take(1),
                tap(() => this.triggerService.triggerPlayers())
            ).subscribe();
        }
    }
}
