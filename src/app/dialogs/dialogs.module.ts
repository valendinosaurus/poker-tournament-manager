import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AddAddonComponent } from './add-addon/add-addon.component';
import { AddBlindsComponent } from './add-blinds/add-blinds.component';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddFinishComponent } from './add-finish/add-finish.component';
import { AddMissingEntriesComponent } from './add-missing-entries/add-missing-entries.component';
import { AddPauseComponent } from './add-pause/add-pause.component';
import { AddPlayerComponent } from './add-player/add-player.component';
import { AddRebuyComponent } from './add-rebuy/add-rebuy.component';
import { AddTournamentComponent } from './add-tournament/add-tournament.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MakeDealComponent } from './make-deal/make-deal.component';
import { ModifyPayoutComponent } from './modify-payout/modify-payout.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [
        AddAddonComponent,
        AddBlindsComponent,
        AddEntryComponent,
        AddFinishComponent,
        AddMissingEntriesComponent,
        AddPauseComponent,
        AddPlayerComponent,
        AddRebuyComponent,
        AddTournamentComponent,
        ConfirmationDialogComponent,
        MakeDealComponent,
        ModifyPayoutComponent
    ],
    imports: [
        SharedModule,
        MatButtonModule
    ],
    exports: [
        AddAddonComponent,
        AddBlindsComponent,
        AddEntryComponent,
        AddFinishComponent,
        AddMissingEntriesComponent,
        AddPauseComponent,
        AddPlayerComponent,
        AddRebuyComponent,
        AddTournamentComponent,
        ConfirmationDialogComponent,
        MakeDealComponent,
        ModifyPayoutComponent
    ],
    providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: []}
    ]
})
export class DialogsModule {
}
