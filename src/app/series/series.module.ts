import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeriesPageComponent } from './page/series-page/series-page.component';
import { SharedModule } from '../shared/shared.module';
import { MathModule } from '../math/math.module';
import { SeriesStatsComponent } from './components/series-stats/series-stats.component';
import { SeriesHeaderComponent } from './components/series-header/series-header.component';
import { SeriesTournamentComponent } from './components/series-tournament/series-tournament.component';

@NgModule({
    declarations: [
        SeriesPageComponent,
        SeriesStatsComponent,
        SeriesHeaderComponent,
        SeriesTournamentComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        MathModule
    ]
})
export class SeriesModule {

}
