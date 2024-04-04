import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../shared/models/player.interface';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService, User } from '@auth0/auth0-angular';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { TriggerService } from '../../../core/services/util/trigger.service';
import { MatDialog } from '@angular/material/dialog';
import {
    ThatsMeDialogComponent
} from '../../../welcome/components/dialogs/thats-me-dialog/thats-me-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-player-list-item',
    templateUrl: './player-list-item.component.html',
    styleUrls: ['./player-list-item.component.scss'],
    standalone: true,
    imports: [NgIf, UserImageRoundComponent, MatInputModule, FormsModule]
})
export class PlayerListItemComponent implements OnChanges {

    @Input() player: Player;
    @Input() myEmail: string | null | undefined;

    editMode = false;

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authService: AuthService = inject(AuthService);
    private matDialog: MatDialog = inject(MatDialog);

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

    thatsMe(): void {
        this.matDialog.open(ThatsMeDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                player: this.player
            }
        });
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
