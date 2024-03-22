import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService, User } from '@auth0/auth0-angular';
import { PlayerApiService } from '../../../../../core/services/api/player-api.service';
import { TriggerService } from '../../../../../core/services/util/trigger.service';

@Component({
    selector: 'app-player-list-item',
    templateUrl: './player-list-item.component.html',
    styleUrls: ['./player-list-item.component.scss']
})
export class PlayerListItemComponent implements OnChanges {

    @Input() player: Player;

    editMode = false;

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authService: AuthService = inject(AuthService);

    playerImageModel: string;
    playerNameModel: string;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['player']?.currentValue !== undefined) {
            this.playerImageModel = this.player.image;
            this.playerNameModel = this.player.name;
        }
    }

    deletePlayer(): void {
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.playerApiService.delete$(this.player.id, sub).pipe(
                take(1),
                tap(() => this.triggerService.triggerPlayers())
            ))
        ).subscribe();
    }

    editPlayer(): void {
        this.editMode = true;
    }

    updatePlayer(): void {
        const newPlayer: Player = {
            ...this.player,
            image: this.playerImageModel,
            name: this.playerNameModel
        };

        this.playerApiService.put$(newPlayer).pipe(
            take(1),
            tap(() => {
                this.editMode = false;
                this.triggerService.triggerPlayers();
            })
        ).subscribe();
    }

}
