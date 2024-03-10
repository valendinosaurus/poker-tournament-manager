import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimePipe } from './pipes/time.pipe';
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
import { PageWithSlideMenuComponent } from './components/page-with-slide-menu/page-with-slide-menu.component';
import { BulletsComponent } from './components/bullets/bullets.component';
import { BlindLevelTextPipe } from './pipes/blind-level-text.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableDrawStateComponent } from './components/table-draw-state/table-draw-state.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';

const SHARED_MODULES = [
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyMatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    OverlayModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
];

@NgModule({
    declarations: [
        TimePipe,
        UnsubscribeComponent,
        UserImageRoundComponent,
        PageWithSlideMenuComponent,
        BulletsComponent,
        BlindLevelTextPipe,
        TableDrawStateComponent,
        LeaderboardComponent
    ],
    imports: [
        ...SHARED_MODULES,
        FormlyModule.forChild(),
    ],
    exports: [
        TimePipe,
        ...SHARED_MODULES,
        FormlyModule,
        UnsubscribeComponent,
        UserImageRoundComponent,
        PageWithSlideMenuComponent,
        BulletsComponent,
        BlindLevelTextPipe,
        TableDrawStateComponent,
        LeaderboardComponent
    ],
})
export class SharedModule {
}
