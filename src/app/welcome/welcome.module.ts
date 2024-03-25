import { NgModule } from '@angular/core';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { SharedModule } from '../shared/shared.module';
import {
    ConnectToOtherUserDialogComponent
} from './components/dialogs/connect-to-other-user-dialog/connect-to-other-user-dialog.component';
import { ThatsMeDialogComponent } from './components/dialogs/thats-me-dialog/thats-me-dialog.component';
import { ConnectionRequestComponent } from './components/connection-request/connection-request.component';
import { AdminModule } from '../admin/admin.module';

@NgModule({
    declarations: [
        WelcomePageComponent,
        ConnectToOtherUserDialogComponent,
        ThatsMeDialogComponent,
        ConnectionRequestComponent
    ],
    imports: [
        SharedModule,
        AdminModule
    ],
    exports: [
        WelcomePageComponent
    ]
})
export class WelcomeModule {
}
