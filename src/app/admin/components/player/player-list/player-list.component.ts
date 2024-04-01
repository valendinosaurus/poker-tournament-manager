import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { Player } from '../../../../shared/models/player.interface';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthService, User } from '@auth0/auth0-angular';
import { PlayerListItemComponent } from './player-list-item/player-list-item.component';
import { NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
    standalone: true,
    imports: [NgFor, PlayerListItemComponent, AsyncPipe]
})
export class PlayerListComponent implements OnInit {

    players$: Observable<Player[]>;
    email$: Observable<string>;

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.players$ = combineLatest([
            this.triggerService.getPlayersTrigger$(),
            this.authService.user$
        ]).pipe(
            map(([_trigger, user]: [void, User | undefined | null]) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            switchMap((sub: string) => this.playerApiService.getAll$(sub).pipe(
                map((players) => players.map(t => ({
                    ...t,
                    finishes: [],
                    structure: []
                })))
            )),
            shareReplay(1)
        );

        this.email$ = this.authService.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            map((user: User) => user.email),
            filter((email: string | undefined): email is string => email !== undefined)
        );
    }

}
