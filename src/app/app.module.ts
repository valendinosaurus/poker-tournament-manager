import { LOCALE_ID, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { TimerModule } from './timer/timer.module';
import { AdminModule } from './admin/admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyMaterialModule } from '@ngx-formly/material';

import localeDECH from '@angular/common/locales/de-CH';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeDECH);

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        AppRoutingModule,
        SharedModule,
        TimerModule,
        AdminModule,
        BrowserAnimationsModule,
        FormlyModule.forRoot(),
        ReactiveFormsModule,
        FormlyMaterialModule,
    ],
    providers: [
        {provide: LOCALE_ID, useValue: 'de-ch'},
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
