import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CountdownModule } from 'ngx-countdown';
import { RouterLink } from '@angular/router';

@NgModule({
    declarations: [],
    imports: [
        SharedModule,
        CountdownModule,
        RouterLink,
    ]
})
export class TestDrawModule {
}
