import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ConnectionRequestApiService } from '../../shared/services/api/connection-request-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConnectionRequest } from '../../shared/interfaces/util/connection-request.interface';
import { PlayerApiService } from '../../shared/services/api/player-api.service';
import { Player } from '../../shared/interfaces/player.interface';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../shared/services/fetch.service';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../shared/services/notification.service';
import { ConnectionRequestState } from '../../shared/enums/connection-request-state.enum';

@Component({
    selector: 'app-map-player',
    templateUrl: './map-player.component.html',
    styleUrls: ['./map-player.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule
    ]
})
export class MapPlayerComponent implements OnInit {

    private dialogRef: MatDialogRef<MapPlayerComponent> = inject(MatDialogRef<MapPlayerComponent>);

    data: {
        request: ConnectionRequest;
    } = inject(MAT_DIALOG_DATA);

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);

    // TODO signal
    allMappablePlayers: Player[];

    model: WritableSignal<Player>;

    ngOnInit(): void {
        this.playerApiService.getAll$().pipe(
            map((players) => players.filter(p => !p.email)),
            tap(p => {
                this.allMappablePlayers = p;
                this.model = signal(p[0]);
            })
        ).subscribe();
    }

    selectPlayer(player: Player): void {
        this.model.set(player);
    }

    confirm(): void {
        this.playerApiService.put$({
            ...this.model(),
            email: this.data.request.requestEmail
        }).pipe(
            take(1),
            switchMap(() => this.connectionRequestApiService.put$({
                    ...this.data.request,
                    state: ConnectionRequestState.ACCEPTED
                })
            ),
            tap(() => this.dialogRef.close()),
            tap(() => this.notificationService.success('Connection request accepted')),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close();
    }

}
