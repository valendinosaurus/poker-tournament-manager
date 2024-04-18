import { enableProdMode, importProvidersFrom, inject, LOCALE_ID } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { AuthGuard, AuthModule } from '@auth0/auth0-angular';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyModule } from '@ngx-formly/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { CanActivateFn, provideRouter, Router, Routes, withRouterConfig } from '@angular/router';
import { WelcomePageComponent } from './app/welcome/welcome-page/welcome-page.component';
import { TimerPageComponent } from './app/timer/page/timer-page/timer-page.component';
import { SeriesPageComponent } from './app/series/page/series-page/series-page.component';
import { AdminComponent } from './app/admin/admin.component';
import { NotFoundPageComponent } from './app/not-found/not-found-page/not-found-page.component';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { SeriesTabComponent } from './app/admin/series/series-tab.component';
import { TournamentTabComponent } from './app/admin/tournament/tournament-tab.component';
import { AdminTournamentComponent } from './app/admin/tournament/admin-tournament/admin-tournament.component';
import { AdminSeriesComponent } from './app/admin/series/admin-series/admin-series.component';
import { PlayersTabComponent } from './app/admin/players/players-tab/players-tab.component';
import { AdminPlayerComponent } from './app/admin/players/admin-player/admin-player.component';
import { AdminBlindLevelComponent } from './app/admin/blind-level/admin-blind-level/admin-blind-level.component';
import { BlindLevelTabComponent } from './app/admin/blind-level/blind-level-tab.component';
import localeDeCh from '@angular/common/locales/de-CH';
import { AdminLocationComponent } from './app/admin/location/admin-location/admin-location.component';
import { AdminBrandingComponent } from './app/admin/branding/admin-branding/admin-branding.component';
import { BrandingTabComponent } from './app/admin/branding/branding-tab.component';
import { LocationTabComponent } from './app/admin/location/location-tab.component';
import { AuthInterceptorService } from './app/core/interceptors/auth-interceptor.service';
import { AuthUtilService } from './app/core/services/auth-util.service';
import { combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
    BlindStructureTabComponent
} from './app/admin/blind-structure/blind-structure-tab/blind-structure-tab.component';
import {
    AdminBlindStructureComponent
} from './app/admin/blind-structure/admin-blind-structure/admin-blind-structure.component';

if (environment.production) {
    enableProdMode();
}

registerLocaleData(localeDeCh, 'de-CH');

export const proOrDomainGuard: CanActivateFn = () => {
    const router: Router = inject(Router);
    const authUtilService: AuthUtilService = inject(AuthUtilService);

    return combineLatest([
        authUtilService.isAdmin$(),
        authUtilService.isPro$()
    ]).pipe(
        map(([isAdmin, isPro]: [boolean, boolean]) => isAdmin || isPro),
        tap((isAllowed: boolean) => {
            if (!isAllowed) {
                router.navigate(['/admin/tournament']);
            }
        })
    );

};

const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => WelcomePageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'timer/:tId',
        loadComponent: () => TimerPageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'test',
        loadComponent: () => TimerPageComponent
    },
    {
        path: 'series/:sId/:password',
        loadComponent: () => SeriesPageComponent,
        data: {
            skipAuth: true
        }
    },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: `tournament`,
                loadComponent: () => TournamentTabComponent
            },
            {
                path: `tournament/:id`,
                loadComponent: () => AdminTournamentComponent
            },
            {
                path: `series`,
                loadComponent: () => SeriesTabComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: `series/:id`,
                loadComponent: () => AdminSeriesComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: `player`,
                loadComponent: () => PlayersTabComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: `player/:id`,
                loadComponent: () => AdminPlayerComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: `blind-level`,
                loadComponent: () => BlindLevelTabComponent
            },
            {
                path: `blind-level/:id`,
                loadComponent: () => AdminBlindLevelComponent
            },
            {
                path: `blind-structure`,
                loadComponent: () => BlindStructureTabComponent
            },
            {
                path: `blind-structure/:id`,
                loadComponent: () => AdminBlindStructureComponent
            },
            {
                path: `location`,
                loadComponent: () => LocationTabComponent
            },
            {
                path: `location/:id`,
                loadComponent: () => AdminLocationComponent
            },
            {
                path: `branding`,
                loadComponent: () => BrandingTabComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: `branding/:id`,
                loadComponent: () => AdminBrandingComponent,
                canActivate: [proOrDomainGuard]
            },
            {
                path: '',
                redirectTo: 'tournament',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'not-found',
        loadComponent: () => NotFoundPageComponent
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            BrowserModule,
            FormlyModule.forRoot(),
            FormlyMaterialModule,
            MatNativeDateModule,
            FormlyMatDatepickerModule,
            AuthModule.forRoot({
                    domain: 'https://pokermanager.eu.auth0.com',
                    clientId: 'NVE3fYgdsVQUYnJ0IEnDobzkKKaaBw9j',
                    authorizationParams: {
                        redirect_uri: window.location.origin,
                        audience: 'api.poker.rugolo.ch'
                    },
                    cacheLocation: 'localstorage'
                }
            )
        ),
        {provide: LOCALE_ID, useValue: 'de-ch'},
        provideAnimations(),
        provideRouter(routes, withRouterConfig({onSameUrlNavigation: 'reload'})),
        provideHttpClient(
            withInterceptorsFromDi(),
        ),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptorService,
            multi: true
        }
    ]
})
    .catch((err) => console.error(err));
