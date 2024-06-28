import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable, timer } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { ConnectionRequest } from '../../shared/interfaces/util/connection-request.interface';
import { ConnectionRequestState } from '../../shared/enums/connection-request-state.enum';
import {
    ConnectToOtherUserDialogComponent
} from '../components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../shared/const/app.const';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConnectionRequestApiService } from '../../shared/services/api/connection-request-api.service';
import { FetchService } from '../../shared/services/fetch.service';
import { Player } from '../../shared/interfaces/player.interface';
import { PlayerApiService } from '../../shared/services/api/player-api.service';
import { ConnectionRequestComponent } from '../components/connection-request/connection-request.component';
import { MatButtonModule } from '@angular/material/button';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { AsyncPipe } from '@angular/common';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { AuthUtilService } from '../../shared/services/auth-util.service';
import { IPayPalConfig, NgxPayPalModule } from 'ngx-paypal';
import { UserListComponent } from './components/user-list/user-list.component';

@Component({
    selector: 'app-welcome-page',
    templateUrl: './welcome-page.component.html',
    styleUrls: ['./welcome-page.component.scss'],
    standalone: true,
    imports: [
        MatDialogModule,
        AppHeaderComponent,
        UserImageRoundComponent,
        MatButtonModule,
        ConnectionRequestComponent,
        AsyncPipe,
        NgxPayPalModule,
        UserListComponent
    ]
})
export class WelcomePageComponent implements OnInit {

    isAuthenticated$: Observable<boolean>;
    user$: Observable<User>;
    userImage$: Observable<string | null | undefined>;
    sub$: Observable<string>;
    email$: Observable<string | null | undefined>;
    roles$: Observable<string[]>;

    allRequests$: Observable<ConnectionRequest[]>;
    incomingRequests$: Observable<ConnectionRequest[]>;
    outgoingAcceptedRequests$: Observable<ConnectionRequest[]>;
    outgoingDeclinedRequests$: Observable<ConnectionRequest[]>;
    outgoingPendingRequests$: Observable<ConnectionRequest[]>;

    myPlayers$: Observable<Player[]>;
    mappedUsers$: Observable<Player[]>;

    userImageSize = window.innerWidth >= 800 ? 36 : 20;

    payPalConfig?: IPayPalConfig;

    private fetchService: FetchService = inject(FetchService);
    private dialog: MatDialog = inject(MatDialog);
    private connectionRequestApiService: ConnectionRequestApiService = inject(ConnectionRequestApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private authService: AuthService = inject(AuthService);

    trigger(): void {
        this.fetchService.trigger();
    }

    ngOnInit() {
        this.isAuthenticated$ = this.authUtilService.getIsAuthenticated$();

        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();
        this.email$ = this.user$.pipe(map(user => user?.email));
        this.roles$ = this.authUtilService.getRoles$();

        this.allRequests$ = combineLatest([
            timer(0, 10000),
            this.fetchService.getFetchTrigger$()
        ]).pipe(
            switchMap(() => this.connectionRequestApiService.getAllByEmail$()),
            shareReplay(1)
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
            switchMap(() => this.email$.pipe(
                switchMap((email: string | null | undefined) =>
                    this.playerApiService.getAll$().pipe(
                        map((players: Player[]) => players.filter(
                            (player: Player) => player.email === email
                        ))
                    )
                )
            ))
        );

        this.mappedUsers$ = this.fetchService.getFetchTrigger$().pipe(
            switchMap(() => this.email$.pipe(
                switchMap((email: string | undefined | null) =>
                    this.playerApiService.getAll$().pipe(
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

        this.initPayPalConfig();
    }

    initPayPalConfig(): void {
        // this.payPalConfig = {
        //     clientId: 'AUKYyACZ9tC771fEzBPP6qCVS0PiBRsSTzb4g0hpj2xlGfKif7r9jQwh3GFvd04BLBGS0SWT36Y5qVUT',
        //     style: {
        //         shape: 'pill',
        //         color: 'blue',
        //         layout: 'vertical',
        //         label: 'subscribe'
        //     },
        //     createSubscription: (actions: any): ICreateSubscriptionRequest => actions.subscription.create({
        //         /* Creates the subscription */
        //         plan_id: 'P-3PC84867AD859235UMYWW3PI'
        //     }),
        //     onApprove: (data: any, actions: any) => {
        //         console.log('onApprove - transaction was approved, but not authorized', data, actions);
        //         actions.order.get().then((details: any) => {
        //             console.log('onApprove - you can get full order details inside onApprove: ', details);
        //         });
        //     },
        //     onCancel: (data: any): void => {
        //         console.log('onCancel - ', data);
        //     }
        // };
    }

    connectToOtherUser(): void {
        this.dialog.open(ConnectToOtherUserDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {}
        });
    }

    login(): void {
        this.authService.loginWithRedirect({
            appState: {target: window.location.href.split(window.location.origin).pop()},
        });
    }

}
