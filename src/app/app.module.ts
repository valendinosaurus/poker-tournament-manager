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
import { DialogsModule } from './dialogs/dialogs.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CdkListbox } from '@angular/cdk/listbox';
import { NotFoundPageComponent } from './not-found/not-found-page/not-found-page.component';
import { NotFoundModule } from './not-found/not-found.module';
import { WelcomeModule } from './welcome/welcome.module';

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
        DialogsModule,
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
        }),
        MatFormFieldModule,
        MatInputModule,
        MatOptionModule,
        MatSelectModule,
        CdkListbox,
        NotFoundModule,
        WelcomeModule
    ],
    providers: [
        {provide: LOCALE_ID, useValue: 'de-ch'},
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
