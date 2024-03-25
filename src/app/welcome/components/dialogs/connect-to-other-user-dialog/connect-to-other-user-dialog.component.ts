import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConnectionRequestApiService } from '../../../../core/services/api/connection-request-api.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { ConnectionRequestState } from '../../../../shared/enums/connection-request-state.enum';
import { FetchService } from '../../../../core/services/fetch.service';

@Component({
    selector: 'app-connect-to-other-user-dialog',
    templateUrl: './connect-to-other-user-dialog.component.html',
    styleUrls: ['./connect-to-other-user-dialog.component.scss']
})
export class ConnectToOtherUserDialogComponent {

    model: {
        mailOwner: WritableSignal<string>;
        name: WritableSignal<string>;
        isValid: Signal<boolean>
    } = {
        name: signal(''),
        mailOwner: signal(''),
        isValid: computed(() => {
            return this.model.name().length > 0 && this.model.mailOwner().length > 0;
        })
    };

    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private authService: AuthService = inject(AuthService);
    private dialogRef: MatDialogRef<ConnectToOtherUserDialogComponent> = inject(MatDialogRef<ConnectToOtherUserDialogComponent>);
    private fetchService: FetchService = inject(FetchService);

    onSubmit(): void {
        this.authService.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            map((user: User) => user.email),
            filter((email: string | undefined): email is string => email !== undefined),
            switchMap((email: string) => this.connectionRequestApiService.post$({
                id: -1,
                requestEmail: email,
                ownerEmail: this.model.mailOwner(),
                externalName: this.model.name(),
                state: ConnectionRequestState.PENDING
            })),
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
