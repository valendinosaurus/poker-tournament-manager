import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ConnectionRequestApiService } from '../../core/services/api/connection-request-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConnectionRequest } from '../../shared/models/util/connection-request.interface';
import { PlayerApiService } from '../../core/services/api/player-api.service';
import { Player } from '../../shared/models/player.interface';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { ConnectionRequestState } from '../../shared/enums/connection-request-state.enum';
import { FetchService } from '../../core/services/fetch.service';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-map-player',
    templateUrl: './map-player.component.html',
    styleUrls: ['./map-player.component.scss'],
    standalone: true,
    imports: [FormsModule, NgIf, MatFormFieldModule, MatSelectModule, NgFor, MatOptionModule, MatButtonModule]
})
export class MapPlayerComponent implements OnInit {

    private dialogRef: MatDialogRef<MapPlayerComponent> = inject(MatDialogRef<MapPlayerComponent>);

    data: {
        request: ConnectionRequest;
    } = inject(MAT_DIALOG_DATA);

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private fetchService: FetchService = inject(FetchService);

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
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    closeDialog(event: Event): void {
        event.preventDefault();
        this.dialogRef.close();
    }

}
