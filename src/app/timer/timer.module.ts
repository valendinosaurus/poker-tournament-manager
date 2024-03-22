import { NgModule } from '@angular/core';
import { TimerComponent } from './components/tournament/timer/timer.component';
import { OverviewComponent } from './components/tournament/overview/overview.component';
import { PlayerOverviewComponent } from './components/tournament/overview/player-overview/player-overview.component';
import { BuyinOverviewComponent } from './components/tournament/overview/buyin-overview/buyin-overview.component';
import { ChipsOverviewComponent } from './components/tournament/overview/chips-overview/chips-overview.component';
import { SharedModule } from '../shared/shared.module';
import { CountdownModule } from 'ngx-countdown';
import { CreateEntryComponent } from './components/create-entry/create-entry.component';
import { TimerPageComponent } from './page/timer-page/timer-page.component';
import {
    BlindLevelOverviewComponent
} from './components/tournament/overview/blind-level-overview/blind-level-overview.component';
import { ButtonsComponent } from './components/tournament/overview/buttons/buttons.component';
import { PlayerDetailsComponent } from './components/tournament/overview/player-details/player-details.component';
import { PayoutDetailsComponent } from './components/tournament/overview/payout-details/payout-details.component';
import { RankingComponent } from './components/tournament/overview/ranking/ranking.component';
import { RouterLink } from '@angular/router';
import { MenuDialogComponent } from './components/tournament/overview/buttons/menu-dialog/menu-dialog.component';
import { LeaderboardInfoComponent } from './components/tournament/overview/leaderboard/leaderboard-info.component';

@NgModule({
    declarations: [
        TimerComponent,
        OverviewComponent,
        PlayerOverviewComponent,
        BuyinOverviewComponent,
        ChipsOverviewComponent,
        CreateEntryComponent,
        TimerPageComponent,
        BlindLevelOverviewComponent,
        ButtonsComponent,
        PlayerDetailsComponent,
        PayoutDetailsComponent,
        RankingComponent,
        MenuDialogComponent,
        LeaderboardInfoComponent,
    ],
    imports: [
        SharedModule,
        CountdownModule,
        RouterLink,
    ],
    exports: [
        TimerComponent,
        TimerPageComponent,
    ],
})
export class TimerModule {
}
