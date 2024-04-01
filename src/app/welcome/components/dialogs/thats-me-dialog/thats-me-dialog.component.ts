import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../../../shared/models/player.interface';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserImageRoundComponent } from '../../../../shared/components/user-image-round/user-image-round.component';

@Component({
    selector: 'app-thats-me-dialog',
    templateUrl: './thats-me-dialog.component.html',
    styleUrls: ['./thats-me-dialog.component.scss'],
    standalone: true,
    imports: [UserImageRoundComponent, FormsModule, MatButtonModule]
})
export class ThatsMeDialogComponent {

    private dialogRef: MatDialogRef<ThatsMeDialogComponent> = inject(MatDialogRef<ThatsMeDialogComponent>);
    data: {
        player: Player,
    } = inject(MAT_DIALOG_DATA);

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authService: AuthService = inject(AuthService);
    private triggerService: TriggerService = inject(TriggerService);

    onSubmit(): void {
        this.authService.user$.pipe(
            take(1),
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            switchMap((user: User) => this.playerApiService.put$({
                ...this.data.player,
                email: user.email
            })),
            tap(() => {
                this.closeDialog(new Event('hello'));
                this.triggerService.triggerPlayers();
            })
        ).subscribe();

    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close();
    }

}
