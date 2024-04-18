import { Component, inject, Input } from '@angular/core';
import { LeaderboardRow } from '../../../series/models/overall-ranking.interface';
import { Series, SeriesS } from '../../models/series.interface';
import { MatDialog } from '@angular/material/dialog';
import { CreatePlayerComponent } from '../../../dialogs/create-player/create-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { Player } from '../../models/player.interface';
import { UserImageRoundComponent } from '../user-image-round/user-image-round.component';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, UserImageRoundComponent, DecimalPipe]
})
export class LeaderboardComponent {

    @Input() leaderboard: LeaderboardRow[] | null;
    @Input() series: Series | SeriesS | null;
    @Input() myEmail: string | undefined | null;
    @Input() full = true;

    dialogPosition = {
        position: {
            top: '40px'
        },
        maxHeight: '90vh'
    };

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
                blockName: true
            }
        });
    }

}
