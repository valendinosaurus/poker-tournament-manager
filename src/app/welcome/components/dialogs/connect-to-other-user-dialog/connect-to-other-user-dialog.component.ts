import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConnectionRequestApiService } from '../../../../core/services/api/connection-request-api.service';
import { filter, switchMap, tap } from 'rxjs/operators';
import { ConnectionRequestState } from '../../../../shared/enums/connection-request-state.enum';
import { FetchService } from '../../../../core/services/fetch.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AuthUtilService } from '../../../../core/services/auth-util.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
    selector: 'app-connect-to-other-user-dialog',
    templateUrl: './connect-to-other-user-dialog.component.html',
    styleUrls: ['./connect-to-other-user-dialog.component.scss'],
    standalone: true,
    imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class ConnectToOtherUserDialogComponent {

    data: {
        ownerEmail?: string;
    } = inject(MAT_DIALOG_DATA);

    model: {
        mailOwner: WritableSignal<string>;
        name: WritableSignal<string>;
        isValid: Signal<boolean>
    } = {
        name: signal(''),
        mailOwner: signal(this.data?.ownerEmail ?? ''),
        isValid: computed(() => {
            return this.model.name().length > 0 && this.model.mailOwner().length > 0;
        })
    };

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialogRef: MatDialogRef<ConnectToOtherUserDialogComponent> = inject(MatDialogRef<ConnectToOtherUserDialogComponent>);
    private fetchService: FetchService = inject(FetchService);
    private notificationService: NotificationService = inject(NotificationService);

    onSubmit(): void {
        this.authUtilService.getEmail$().pipe(
            filter((email: string | undefined): email is string => email !== undefined),
            switchMap((email: string) => this.connectionRequestApiService.post$({
                id: -1,
                requestEmail: email,
                ownerEmail: this.model.mailOwner(),
                externalName: this.model.name(),
                state: ConnectionRequestState.PENDING
            })),
            tap(() => this.notificationService.success('Connection request sent')),
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
