import { Component, inject, Input } from '@angular/core';
import { ConnectionRequest } from '../../../shared/models/connection-request.interface';
import { ConnectionRequestApiService } from '../../../core/services/api/connection-request-api.service';
import { take, tap } from 'rxjs/operators';
import { FetchService } from '../../../core/services/fetch.service';
import { ConnectionRequestState } from '../../../shared/enums/connection-request-state.enum';
import { MatDialog } from '@angular/material/dialog';
import { MapPlayerComponent } from '../../../dialogs/map-player/map-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';

@Component({
    selector: 'app-connection-request',
    templateUrl: './connection-request.component.html',
    styleUrls: ['./connection-request.component.scss']
})
export class ConnectionRequestComponent {

    @Input() connectionRequest: ConnectionRequest;
    @Input() myEmail: string | undefined | null;

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private fetchService: FetchService = inject(FetchService);

    private dialog: MatDialog = inject(MatDialog);

    deleteRequest(): void {
        this.connectionRequestApiService.delete$(this.connectionRequest.id).pipe(
            take(1),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    acceptRequest(): void {
        this.dialog.open(MapPlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                request: this.connectionRequest
            }
        })

    }

    declineRequest(): void {
        this.connectionRequestApiService.put$({
            ...this.connectionRequest,
            state: ConnectionRequestState.DECLINED
        }).pipe(
            take(1),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

}
