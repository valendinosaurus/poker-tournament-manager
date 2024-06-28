import { Component, inject, input } from '@angular/core';
import { ConnectionRequest } from '../../../shared/interfaces/util/connection-request.interface';
import { ConnectionRequestApiService } from '../../../shared/services/api/connection-request-api.service';
import { take, tap } from 'rxjs/operators';
import { FetchService } from '../../../shared/services/fetch.service';
import { ConnectionRequestState } from '../../../shared/enums/connection-request-state.enum';
import { MatDialog } from '@angular/material/dialog';
import { MapPlayerComponent } from '../../../dialogs/map-player/map-player.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
    selector: 'app-connection-request',
    templateUrl: './connection-request.component.html',
    styleUrls: ['./connection-request.component.scss'],
    standalone: true,
})
export class ConnectionRequestComponent {

    connectionRequest = input.required<ConnectionRequest>();
    myEmail = input<string | undefined | null>(undefined);

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);
    private dialog: MatDialog = inject(MatDialog);

    deleteRequest(): void {
        this.connectionRequestApiService.delete$(this.connectionRequest().id).pipe(
            take(1),
            tap(() => this.notificationService.success('Connection request deleted')),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    acceptRequest(): void {
        this.dialog.open(MapPlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                request: this.connectionRequest()
            }
        });

    }

    declineRequest(): void {
        this.connectionRequestApiService.put$({
            ...this.connectionRequest(),
            state: ConnectionRequestState.DECLINED
        }).pipe(
            take(1),
            tap(() => this.notificationService.success('Connection request declined')),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

}
