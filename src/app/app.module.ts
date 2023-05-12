import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreatePlayerComponent } from './components/create-player/create-player.component';
import { CreateTournamentComponent } from './components/create-tournament/create-tournament.component';
import { BuyinOverviewComponent } from './components/tournament/buyin-overview/buyin-overview.component';
import { ControlsComponent } from './components/tournament/controls/controls.component';
import { CurrentLevelComponent } from './components/tournament/current-level/current-level.component';
import { HeaderComponent } from './components/tournament/header/header.component';
import { NextLevelComponent } from './components/tournament/next-level/next-level.component';
import { OverviewComponent } from './components/tournament/overview/overview.component';
import { PayoutComponent } from './components/tournament/payout/payout.component';
import { PlayerOverviewComponent } from './components/tournament/player-overview/player-overview.component';
import { TournamentComponent } from './components/tournament/tournament-view/tournament.component';
import { CounterDirective } from './counter.directive';
import { SharedModule } from './shared/shared.module';
import { ChipsOverviewComponent } from './components/tournament/chips-overview/chips-overview.component';
import { LevelPipe } from './level.pipe';

@NgModule({
  declarations: [
    AppComponent,
    TournamentComponent,
    CounterDirective,
    CreatePlayerComponent,
    CreateTournamentComponent,
    OverviewComponent,
    ControlsComponent,
    PayoutComponent,
    CurrentLevelComponent,
    NextLevelComponent,
    PlayerOverviewComponent,
    BuyinOverviewComponent,
    HeaderComponent,
    ChipsOverviewComponent,
    LevelPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    SharedModule,
    NgCircleProgressModule.forRoot({
      radius: 150,
      outerStrokeWidth: 25,
      innerStrokeWidth: 10,
      outerStrokeColor: 'blue',
      innerStrokeColor: 'darkblue',
      animationDuration: 300,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
