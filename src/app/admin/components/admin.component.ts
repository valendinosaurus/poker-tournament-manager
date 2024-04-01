import { Component, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, User } from '@auth0/auth0-angular';
import { shareReplay } from 'rxjs/operators';
import { AsyncPipe, JsonPipe, NgForOf } from '@angular/common';
import { BlindLevelTabComponent } from './blind-level/blind-level-tab.component';
import { PlayerTabComponent } from './player/player-tab.component';
import { SeriesTabComponent } from './series/series-tab.component';
import { TournamentTabComponent } from './tournament/tournament-tab.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { NullsafePrimitivePipe } from '../../core/pipes/nullsafe-primitive.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet } from '@angular/router';

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
        PlayerTabComponent,
        BlindLevelTabComponent,
        AsyncPipe,
        MatSidenavModule,
        MatToolbarModule,
        NgForOf,
        FormsModule,
        NullsafePrimitivePipe,
        MatCheckboxModule,
        MatButtonModule,
        MatMenuModule,
        RouterOutlet,
        RouterLink,
        JsonPipe
    ]
})
export class AdminComponent implements OnInit {

    user$: Observable<User | null | undefined>;
    isOpen = signal(true);

    private authService: AuthService = inject(AuthService);

    ngOnInit() {
        localStorage.setItem('route', `${window.location.href.split(window.location.origin).pop()}`);

        this.user$ = this.authService.user$.pipe(shareReplay(1));
    }

    toggleSidenav(): void {
        this.isOpen.set(!this.isOpen());
    }

}
