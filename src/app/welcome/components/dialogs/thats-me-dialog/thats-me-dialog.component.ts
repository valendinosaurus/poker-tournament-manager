import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../../../shared/interfaces/player.interface';
import { PlayerApiService } from '../../../../shared/services/api/player-api.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../shared/services/util/trigger.service';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserImageRoundComponent } from '../../../../shared/components/user-image-round/user-image-round.component';
import { NgIf } from '@angular/common';
import { AuthUtilService } from '../../../../shared/services/auth-util.service';
import { UserWithImageComponent } from '../../../../shared/components/user-with-image/user-with-image.component';

@Component({
    selector: 'app-thats-me-dialog',
    templateUrl: './thats-me-dialog.component.html',
    styleUrls: ['./thats-me-dialog.component.scss'],
    standalone: true,
    imports: [UserImageRoundComponent, FormsModule, MatButtonModule, NgIf, UserWithImageComponent]
})
export class ThatsMeDialogComponent {

    private dialogRef: MatDialogRef<ThatsMeDialogComponent> = inject(MatDialogRef<ThatsMeDialogComponent>);
    data: {
        player: Player,
        itsMe: boolean
    } = inject(MAT_DIALOG_DATA);

    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private triggerService: TriggerService = inject(TriggerService);

    onSubmit(): void {
        this.authUtilService.getUser$().pipe(
            take(1),
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            switchMap((user: User) => this.playerApiService.put$({
                ...this.data.player,
                email: this.data.itsMe ? user.email : ''
            })),
            tap(() => {
                this.dialogRef.close(true);
                this.triggerService.triggerPlayers();
            })
        ).subscribe();

    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

}
