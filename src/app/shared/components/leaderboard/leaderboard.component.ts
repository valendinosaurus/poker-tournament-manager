import { Component, inject, Input } from '@angular/core';
import { LeaderboardRow } from '../../../series/models/overall-ranking.interface';
import { SeriesDetails, SeriesDetailsS } from '../../models/series-details.interface';
import { MatDialog } from '@angular/material/dialog';
import { EditPlayerComponent } from '../../../dialogs/edit-player/edit-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { Player } from '../../models/player.interface';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {

    @Input() leaderboard: LeaderboardRow[] | null;
    @Input() series: SeriesDetails | SeriesDetailsS | null;
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
            id: row.playerId
        };

        console.log('edit', playerToEdit);

        this.dialog.open(EditPlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: playerToEdit
            }
        });
    }

}
