import { NgModule } from '@angular/core';
import { AdminComponent } from './components/admin.component';
import { SharedModule } from '../shared/shared.module';
import { CreatePlayerComponent } from './components/player/create-player/create-player.component';
import { CreateLocationComponent } from './components/location/create-location/create-location.component';
import { CreateBrandingComponent } from './components/branding/create-branding/create-branding.component';
import { CreateTournamentComponent } from './components/tournament/create-tournament/create-tournament.component';
import { CreateSeriesComponent } from './components/series/create-series/create-series.component';
import { CreateBlindLevelComponent } from './components/blind-level/create-blind-level/create-blind-level.component';
import { AddPlayerComponent } from './components/dialogs/add-player/add-player.component';
import { AddRebuyComponent } from './components/dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from './components/dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from './components/dialogs/add-finish/add-finish.component';
import { AddBlindsComponent } from './components/dialogs/add-blinds/add-blinds.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { PlayerListComponent } from './components/player/player-list/player-list.component';
import { SeriesListComponent } from './components/series/series-list/series-list.component';
import { TournamentListComponent } from './components/tournament/tournament-list/tournament-list.component';
import { BlindLevelListComponent } from './components/blind-level/blind-level-list/blind-level-list.component';
import { LocationListComponent } from './components/location/location-list/location-list.component';
import { LocationTabComponent } from './components/location/location-tab.component';
import { BlindLevelTabComponent } from './components/blind-level/blind-level-tab.component';
import { TournamentTabComponent } from './components/tournament/tournament-tab.component';
import { SeriesTabComponent } from './components/series/series-tab.component';
import { PlayerTabComponent } from './components/player/player-tab.component';
import { BrandingListComponent } from './components/branding/branding-list/branding-list.component';
import { BrandingTabComponent } from './components/branding/branding-tab.component';
import { CreatePauseComponent } from './components/blind-level/create-pause/create-pause.component';
import {
    TournamentListItemComponent
} from './components/tournament/tournament-list/tournament-list-item/tournament-list-item.component';
import { SeriesListItemComponent } from './components/series/series-list/series-list-item/series-list-item.component';
import { AddMissingEntriesComponent } from './components/dialogs/add-missing-entries/add-missing-entries.component';
import { AddTournamentComponent } from './components/dialogs/add-tournament/add-tournament.component';
import { AddReEntryComponent } from './components/dialogs/add-re-entry/add-re-entry.component';
import { AddPauseComponent } from './components/dialogs/add-pause/add-pause.component';
import { MakeDealComponent } from './components/dialogs/make-deal/make-deal.component';
import { ModifyPayoutComponent } from './components/dialogs/modify-payout/modify-payout.component';

@NgModule({
    declarations: [
        AdminComponent,
        CreatePlayerComponent,
        CreateLocationComponent,
        CreateBrandingComponent,
        CreateTournamentComponent,
        CreateSeriesComponent,
        CreateBlindLevelComponent,
        AddPlayerComponent,
        AddRebuyComponent,
        AddAddonComponent,
        AddFinishComponent,
        AddBlindsComponent,
        PlayerListComponent,
        SeriesListComponent,
        TournamentListComponent,
        BlindLevelListComponent,
        LocationListComponent,
        LocationTabComponent,
        BlindLevelTabComponent,
        TournamentTabComponent,
        SeriesTabComponent,
        PlayerTabComponent,
        BrandingListComponent,
        BrandingTabComponent,
        CreatePauseComponent,
        TournamentListItemComponent,
        SeriesListItemComponent,
        AddMissingEntriesComponent,
        AddTournamentComponent,
        AddReEntryComponent,
        AddPauseComponent,
        MakeDealComponent,
        ModifyPayoutComponent,
    ],
    imports: [
        SharedModule,
        MatTabsModule
    ],
    exports: [
        AdminComponent
    ],
    providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: []}
    ]
})
export class AdminModule {
}
