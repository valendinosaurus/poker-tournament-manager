import { enableProdMode, importProvidersFrom, LOCALE_ID } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { AuthModule } from '@auth0/auth0-angular';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyModule } from '@ngx-formly/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideRouter, Routes, withRouterConfig } from '@angular/router';
import { WelcomePageComponent } from './app/welcome/welcome-page/welcome-page.component';
import { TimerPageComponent } from './app/timer/page/timer-page/timer-page.component';
import { SeriesPageComponent } from './app/series/page/series-page/series-page.component';
import { AdminComponent } from './app/admin/components/admin.component';
import { NotFoundPageComponent } from './app/not-found/not-found-page/not-found-page.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { SeriesTabComponent } from './app/admin/components/series/series-tab.component';
import { TournamentTabComponent } from './app/admin/components/tournament/tournament-tab.component';
import { AdminTournamentComponent } from './app/admin/admin-tournament/admin-tournament.component';
import { AdminSeriesComponent } from './app/admin/admin-series/admin-series.component';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => WelcomePageComponent
    },
    {
        path: 'timer/:tId',
        loadComponent: () => TimerPageComponent
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
                loadComponent: () => SeriesTabComponent
            },
            {
                path: `series/:id`,
                loadComponent: () => AdminSeriesComponent
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

registerLocaleData(localeDe, 'de-ch');

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, FormlyModule.forRoot(), FormlyMaterialModule, AuthModule.forRoot({
            domain: 'pokermanager.eu.auth0.com',
            clientId: 'NVE3fYgdsVQUYnJ0IEnDobzkKKaaBw9j',
            authorizationParams: {
                redirect_uri: window.location.origin,
            }
        })),
        {provide: LOCALE_ID, useValue: 'de-ch'},
        provideAnimations(),
        provideRouter(routes, withRouterConfig({onSameUrlNavigation: 'reload'})),
        provideHttpClient(withInterceptorsFromDi())
    ]
})
    .catch((err) => console.error(err));
