import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeriesPageComponent } from './page/series-page/series-page.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    SeriesPageComponent
  ],
    imports: [
        CommonModule,
        SharedModule
    ]
})
export class SeriesModule { }
