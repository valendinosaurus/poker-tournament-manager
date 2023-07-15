import { NgModule } from '@angular/core';
import { TimerComponent } from './components/tournament/timer/timer.component';
import { OverviewComponent } from './components/tournament/overview/overview.component';
import { CurrentLevelComponent } from './components/tournament/current-level/current-level.component';
import { NextLevelComponent } from './components/tournament/next-level/next-level.component';
import { PlayerOverviewComponent } from './components/tournament/player-overview/player-overview.component';
import { BuyinOverviewComponent } from './components/tournament/buyin-overview/buyin-overview.component';
import { HeaderComponent } from './components/tournament/header/header.component';
import { ChipsOverviewComponent } from './components/tournament/chips-overview/chips-overview.component';
import { SharedModule } from '../shared/shared.module';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { CountdownModule } from 'ngx-countdown';
import { CreateEntryComponent } from './components/create-entry/create-entry.component';
import { TimerPageComponent } from './page/timer-page/timer-page.component';
import {
    BlindLevelOverviewComponent
} from './components/tournament/blind-level-overview/blind-level-overview.component';
import { ButtonsComponent } from './components/tournament/buttons/buttons.component';
import { PlayerDetailsComponent } from './components/tournament/player-details/player-details.component';
import { PayoutDetailsComponent } from './components/tournament/payout-details/payout-details.component';
import { RankingComponent } from './components/tournament/ranking/ranking.component';

@NgModule({
    declarations: [
        TimerComponent,
        OverviewComponent,
        CurrentLevelComponent,
        NextLevelComponent,
        PlayerOverviewComponent,
        BuyinOverviewComponent,
        HeaderComponent,
        ChipsOverviewComponent,
        CreateEntryComponent,
        TimerPageComponent,
        BlindLevelOverviewComponent,
        ButtonsComponent,
        PlayerDetailsComponent,
        PayoutDetailsComponent,
        RankingComponent,
    ],
    imports: [
        SharedModule,
        NgCircleProgressModule.forRoot({
            radius: 150,
            outerStrokeWidth: 25,
            innerStrokeWidth: 10,
            outerStrokeColor: 'blue',
            innerStrokeColor: 'darkblue',
            animationDuration: 300,
        }),
        CountdownModule
    ],
    exports: [
        TimerComponent,
        TimerPageComponent,
    ],
})
export class TimerModule {
}
