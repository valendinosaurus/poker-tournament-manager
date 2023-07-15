import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimePipe } from './pipes/time.pipe';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormlyModule } from '@ngx-formly/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { UnsubscribeComponent } from './components/unsubscribe/unsubscribe.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatRadioModule } from '@angular/material/radio';
import { UserImageRoundComponent } from './components/user-image-round/user-image-round.component';

const SHARED_MODULES = [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyMatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    OverlayModule,
    MatRadioModule
];

@NgModule({
    declarations: [TimePipe, UnsubscribeComponent, UserImageRoundComponent],
    imports: [
        ...SHARED_MODULES,
        FormlyModule.forChild(),
    ],
    exports: [
        TimePipe,
        ...SHARED_MODULES,
        FormlyModule,
        UnsubscribeComponent,
        UserImageRoundComponent

    ],
})
export class SharedModule {
}
