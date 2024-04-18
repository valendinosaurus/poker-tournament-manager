import { Component, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { AsyncPipe, JsonPipe, NgForOf, NgIf } from '@angular/common';
import { BlindLevelTabComponent } from './blind-level/blind-level-tab.component';
import { SeriesTabComponent } from './series/series-tab.component';
import { TournamentTabComponent } from './tournament/tournament-tab.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AppHeaderComponent } from '../shared/components/app-header/app-header.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { NullsafePrimitivePipe } from '../core/pipes/nullsafe-primitive.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthUtilService } from '../core/services/auth-util.service';

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
        NgForOf,
        FormsModule,
        NullsafePrimitivePipe,
        MatCheckboxModule,
        MatButtonModule,
        MatMenuModule,
        RouterOutlet,
        RouterLink,
        JsonPipe,
        NgIf
    ]
})
export class AdminComponent implements OnInit {

    isAuthenticated$: Observable<boolean>;
    user$: Observable<User>;
    isAdmin$: Observable<boolean>;
    isPro$: Observable<boolean>;

    isOpen = signal(window.innerWidth >= 800);

    private authUtilService: AuthUtilService = inject(AuthUtilService);

    ngOnInit() {
        this.isAuthenticated$ = this.authUtilService.getIsAuthenticated$();
        this.user$ = this.authUtilService.getUser$();
        this.isAdmin$ = this.authUtilService.isAdmin$();
        this.isPro$ = this.authUtilService.isPro$();
    }

    toggleSidenav(): void {
        this.isOpen.set(!this.isOpen());
    }

}
