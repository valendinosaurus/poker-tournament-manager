import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable, timer } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { ConnectionRequest } from '../../shared/models/connection-request.interface';
import { ConnectionRequestState } from '../../shared/enums/connection-request-state.enum';
import {
    ConnectToOtherUserDialogComponent
} from '../components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../core/const/app.const';
import { MatDialog } from '@angular/material/dialog';
import { ConnectionRequestApiService } from '../../core/services/api/connection-request-api.service';
import { FetchService } from '../../core/services/fetch.service';
import { Player } from '../../shared/models/player.interface';
import { PlayerApiService } from '../../core/services/api/player-api.service';

@Component({
    selector: 'app-welcome-page',
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss']
})
export class WelcomePageComponent implements OnInit {

    user$: Observable<User | null | undefined>;
    userImage$: Observable<string | null | undefined>;
    sub$: Observable<string>;
    email$: Observable<string | null | undefined>;

    private authService: AuthService = inject(AuthService);

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

    trigger(): void {
        this.fetchService.trigger();
    }

    ngOnInit() {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);

        this.user$ = this.authService.user$.pipe(shareReplay(1));
        this.email$ = this.user$.pipe(map(user => user?.email));
        this.sub$ = this.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            map(user => user.sub),
            filter((sub: string | undefined): sub is string => sub !== undefined)
        );

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
