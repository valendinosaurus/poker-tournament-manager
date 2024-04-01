import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable, timer } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { filter, map, switchMap } from 'rxjs/operators';
import { ConnectionRequest } from '../../shared/models/util/connection-request.interface';
import { ConnectionRequestState } from '../../shared/enums/connection-request-state.enum';
import {
    ConnectToOtherUserDialogComponent
} from '../components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../core/const/app.const';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConnectionRequestApiService } from '../../core/services/api/connection-request-api.service';
import { FetchService } from '../../core/services/fetch.service';
import { Player } from '../../shared/models/player.interface';
import { PlayerApiService } from '../../core/services/api/player-api.service';
import { ConnectionRequestComponent } from '../components/connection-request/connection-request.component';
import { MatButtonModule } from '@angular/material/button';
import {
    PlayerListItemComponent
} from '../../admin/components/player/player-list/player-list-item/player-list-item.component';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { AuthUtilService } from '../../core/services/auth-util.service';

@Component({
    selector: 'app-welcome-page',
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss'],
    standalone: true,
    imports: [
        MatDialogModule,
        AppHeaderComponent,
        NgIf,
        UserImageRoundComponent,
        NgFor,
        PlayerListItemComponent,
        MatButtonModule,
        ConnectionRequestComponent,
        AsyncPipe
    ]
})
export class WelcomePageComponent implements OnInit {

    user$: Observable<User>;
    userImage$: Observable<string | null | undefined>;
    sub$: Observable<string>;
    email$: Observable<string | null | undefined>;

    allRequests$: Observable<ConnectionRequest[]>;
    incomingRequests$: Observable<ConnectionRequest[]>;
    outgoingAcceptedRequests$: Observable<ConnectionRequest[]>;
    outgoingDeclinedRequests$: Observable<ConnectionRequest[]>;
    outgoingPendingRequests$: Observable<ConnectionRequest[]>;

    myPlayers$: Observable<Player[]>;
    mappedUsers$: Observable<Player[]>;

    private fetchService: FetchService = inject(FetchService);
    private dialog: MatDialog = inject(MatDialog);
    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    trigger(): void {
        this.fetchService.trigger();
    }

    ngOnInit() {

        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();
        this.email$ = this.user$.pipe(map(user => user?.email));

        this.allRequests$ = combineLatest([
            timer(0, 10000),
            this.fetchService.getFetchTrigger$()
        ]).pipe(
            switchMap(() => this.connectionRequestApiService.getAllByEmail$())
        );

        const email$: Observable<string> = this.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            map((user: User) => user.email),
            filter((email: string | undefined): email is string => email !== undefined)
        );

        this.incomingRequests$ = email$.pipe(
            switchMap((myEmail: string) => this.allRequests$.pipe(
                map((requests: ConnectionRequest[]) => requests.filter(r => r.ownerEmail === myEmail)),
                map((requests: ConnectionRequest[]) => requests.filter(r => r.state === ConnectionRequestState.PENDING))
            ))
        );

        this.outgoingAcceptedRequests$ = email$.pipe(
            switchMap((myEmail: string) => this.allRequests$.pipe(
                map((requests: ConnectionRequest[]) => requests.filter(r => r.requestEmail === myEmail)),
                map((requests: ConnectionRequest[]) => requests.filter(r => r.state === ConnectionRequestState.ACCEPTED))
            ))
        );

        this.outgoingDeclinedRequests$ = email$.pipe(
            switchMap((myEmail: string) => this.allRequests$.pipe(
                map((requests: ConnectionRequest[]) => requests.filter(r => r.requestEmail === myEmail)),
                map((requests: ConnectionRequest[]) => requests.filter(r => r.state === ConnectionRequestState.DECLINED))
            ))
        );

        this.outgoingPendingRequests$ = email$.pipe(
            switchMap((myEmail: string) => this.allRequests$.pipe(
                map((requests: ConnectionRequest[]) => requests.filter(r => r.requestEmail === myEmail)),
                map((requests: ConnectionRequest[]) => requests.filter(r => r.state === ConnectionRequestState.PENDING))
            ))
        );

        this.myPlayers$ = this.fetchService.getFetchTrigger$().pipe(
            switchMap(() => combineLatest([
                this.email$,
                this.sub$
            ]).pipe(
                switchMap(([email, sub]: [string | undefined | null, string]) =>
                    this.playerApiService.getAll$(sub).pipe(
                        map((players: Player[]) => players.filter(
                            (player: Player) => player.email === email
                        ))
                    )
                )
            ))
        );

        this.mappedUsers$ = this.fetchService.getFetchTrigger$().pipe(
            switchMap(() => combineLatest([
                this.email$,
                this.sub$
            ]).pipe(
                switchMap(([email, sub]: [string | undefined | null, string]) =>
                    this.playerApiService.getAll$(sub).pipe(
                        map((players: Player[]) => players.filter(
                            (player: Player) => player.email && player.email !== email
                        ))
                    )
                )
            ))
        );

        this.userImage$ = combineLatest([
            this.user$,
            this.myPlayers$
        ]).pipe(
            map(([user, myPlayers]: [User | undefined | null, Player[]]) => {
                if (myPlayers.length > 0) {
                    return myPlayers[0].image;
                }

                return user?.picture;
            })
        );

        this.fetchService.trigger();

    }

    connectToOtherUser(): void {
        this.dialog.open(ConnectToOtherUserDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {}
        });
    }

}
