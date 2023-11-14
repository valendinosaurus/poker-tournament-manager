import { LOCALE_ID, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TimerModule } from './timer/timer.module';
import { AdminModule } from './admin/admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyMaterialModule } from '@ngx-formly/material';

import localeDECH from '@angular/common/locales/de-CH';
import { registerLocaleData } from '@angular/common';
import { AuthModule } from '@auth0/auth0-angular';
import { SeriesModule } from './series/series.module';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';

registerLocaleData(localeDECH);

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        SharedModule,
        TimerModule,
        SeriesModule,
        AdminModule,
        BrowserAnimationsModule,
        FormlyModule.forRoot(),
        ReactiveFormsModule,
        FormlyMaterialModule,
        AuthModule.forRoot({
            domain: 'pokermanager.eu.auth0.com',
            clientId: 'NVE3fYgdsVQUYnJ0IEnDobzkKKaaBw9j',
            authorizationParams: {
                redirect_uri: window.location.origin,

            }
        })
    ],
    providers: [
        {provide: LOCALE_ID, useValue: 'de-ch'},
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
