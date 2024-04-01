import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../shared/models/player.interface';
import { PlayerApiService } from '../../core/services/api/player-api.service';
import { AuthService } from '@auth0/auth0-angular';
import { FetchService } from '../../core/services/fetch.service';
import { take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-edit-player',
    templateUrl: './edit-player.component.html',
    styleUrls: ['./edit-player.component.scss'],
    standalone: true,
    imports: [FormsModule, UserImageRoundComponent, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class EditPlayerComponent implements OnInit {

    private dialogRef: MatDialogRef<EditPlayerComponent> = inject(MatDialogRef<EditPlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authService: AuthService = inject(AuthService);
    private fetchService: FetchService = inject(FetchService);

    data: {
        player: Player;
    } = inject(MAT_DIALOG_DATA);

    model: {
        userImage: WritableSignal<string>;
        userImageCache: WritableSignal<string>;
        name: WritableSignal<string>;
        nameCache: WritableSignal<string>
        isValid: Signal<boolean>
    };

    ngOnInit(): void {
        this.model = {
            userImage: signal(this.data.player.image),
            userImageCache: signal(this.data.player.image),
            name: signal(this.data.player.name),
            nameCache: signal(this.data.player.name),
            isValid: computed(() =>
                !(this.model.nameCache() === this.model.name()
                    && this.model.userImageCache() === this.model.userImage())
            )
        };
    }

    onSubmit(): void {
        this.playerApiService.put$({
            ...this.data.player,
            name: this.model.name(),
            image: this.model.userImage()
        }).pipe(
            take(1),
            tap(() => {
                this.fetchService.trigger();
                this.dialogRef.close();
            })
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close();
    }
}
