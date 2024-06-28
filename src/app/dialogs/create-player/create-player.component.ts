import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '../../shared/interfaces/player.interface';
import { PlayerApiService } from '../../shared/services/api/player-api.service';
import { FetchService } from '../../shared/services/fetch.service';
import { take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-edit-player',
    templateUrl: './create-player.component.html',
    styleUrls: ['./create-player.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        UserImageRoundComponent,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ]
})
export class CreatePlayerComponent implements OnInit {

    private dialogRef: MatDialogRef<CreatePlayerComponent> = inject(MatDialogRef<CreatePlayerComponent>);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private fetchService: FetchService = inject(FetchService);

    readonly WINDOW = window;

    data: {
        player: Player | null;
        blockName: boolean,
        external: boolean
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
            userImage: signal(this.data?.player?.image ?? ''),
            userImageCache: signal(this.data?.player?.image ?? ''),
            name: signal(this.data?.player?.name ?? ''),
            nameCache: signal(this.data?.player?.name ?? ''),
            isValid: computed(() =>
                !(this.model.nameCache() === this.model.name()
                    && this.model.userImageCache() === this.model.userImage())
            )
        };
    }

    onSubmit(): void {
        if (this.data?.player) {
            if (this.data?.external) {
                this.playerApiService.putAndKeepSub$({
                    ...this.data.player,
                    name: this.model.name(),
                    image: this.model.userImage()
                }).pipe(
                    take(1),
                    tap(() => {
                        this.fetchService.trigger();
                        this.dialogRef.close(true);
                    })
                ).subscribe();
            } else {
                this.playerApiService.put$({
                    ...this.data.player,
                    name: this.model.name(),
                    image: this.model.userImage()
                }).pipe(
                    take(1),
                    tap(() => {
                        this.fetchService.trigger();
                        this.dialogRef.close(true);
                    })
                ).subscribe();
            }
        } else {
            this.playerApiService.post$({
                name: this.model.name(),
                image: this.model.userImage(),
                locked: false,
                id: -1
            }).pipe(
                take(1),
                tap(() => {
                    this.fetchService.trigger();
                    this.dialogRef.close(true);
                })
            ).subscribe();
        }
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close(false);
    }

}
