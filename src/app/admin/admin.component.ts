import { Component, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { BlindLevelTabComponent } from './blind-level/blind-level-tab.component';
import { SeriesTabComponent } from './series/series-tab.component';
import { TournamentTabComponent } from './tournament/tournament-tab.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AppHeaderComponent } from '../shared/components/app-header/app-header.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { NullsafePrimitivePipe } from '../shared/pipes/nullsafe-primitive.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthUtilService } from '../shared/services/auth-util.service';
import { take, tap } from 'rxjs/operators';
import { Player } from '../shared/interfaces/player.interface';
import { PlayerApiService } from '../shared/services/api/player-api.service';
import { TimerStateService } from '../timer/services/timer-state.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    standalone: true,
    imports: [
        MatDialogModule,
        AppHeaderComponent,
        MatTabsModule,
        TournamentTabComponent,
        SeriesTabComponent,
        BlindLevelTabComponent,
        AsyncPipe,
        MatSidenavModule,
        MatToolbarModule,
        FormsModule,
        NullsafePrimitivePipe,
        MatCheckboxModule,
        MatButtonModule,
        MatMenuModule,
        RouterOutlet,
        RouterLink,
        NgTemplateOutlet,
        RouterLinkActive
    ]
})
export class AdminComponent implements OnInit {

    isAuthenticated$: Observable<boolean>;
    user$: Observable<User>;
    isAdmin$: Observable<boolean>;
    isPro$: Observable<boolean>;

    isOpen = signal(window.innerWidth >= 800);

    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private state: TimerStateService = inject(TimerStateService);
    private authService: AuthService = inject(AuthService);

    ngOnInit() {
        this.isAuthenticated$ = this.authUtilService.getIsAuthenticated$();
        this.user$ = this.authUtilService.getUser$();
        this.isAdmin$ = this.authUtilService.isAdmin$();
        this.isPro$ = this.authUtilService.isPro$();

        this.playerApiService.getAll$().pipe(
            take(1),
            tap((players: Player[]) => {
                this.state.allAvailablePlayers.set(players);
            })
        ).subscribe();
    }

    toggleSidenav(): void {
        this.isOpen.set(!this.isOpen());
    }

    login(): void {
        this.authService.loginWithRedirect({
            appState: {target: window.location.href.split(window.location.origin).pop()},
        });
    }

}
