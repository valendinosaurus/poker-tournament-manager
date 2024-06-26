import { Component, computed, inject, input } from '@angular/core';
import { LeaderboardRow } from '../../../series/interfaces/overall-ranking.interface';
import { Series, SeriesS } from '../../interfaces/series.interface';
import { MatDialog } from '@angular/material/dialog';
import { CreatePlayerComponent } from '../../../dialogs/create-player/create-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { Player } from '../../interfaces/player.interface';
import { UserImageRoundComponent } from '../user-image-round/user-image-round.component';
import { DecimalPipe } from '@angular/common';
import { UserWithImageComponent } from '../user-with-image/user-with-image.component';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
    standalone: true,
    imports: [
        UserImageRoundComponent,
        DecimalPipe,
        UserWithImageComponent
    ]
})
export class LeaderboardComponent {

    leaderboard = input.required<LeaderboardRow[]>();
    series = input.required<Series | SeriesS>();
    userEmail = input<string>();
    full = input<boolean>(true);
    hasRebuy = input.required<boolean>();
    hasAddon = input.required<boolean>();
    hasBounty = input.required<boolean>();

    numberOfDisqualifiedPlayers = computed(() =>
        this.leaderboard().filter(e => e.disqualified).length
    );

    private dialog: MatDialog = inject(MatDialog);

    openEditPlayerDialog(row: LeaderboardRow): void {
        const playerToEdit: Player = {
            name: row.name,
            image: row.image,
            email: row.email,
            id: row.playerId,
            locked: false
        };

        this.dialog.open(CreatePlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: playerToEdit,
                blockName: true,
                external: true
            }
        });
    }

}
