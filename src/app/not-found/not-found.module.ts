import { NgModule } from '@angular/core';
import { NotFoundPageComponent } from './not-found-page/not-found-page.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [
        NotFoundPageComponent
    ],
    imports: [
        SharedModule,
    ],
    exports: [
        NotFoundPageComponent
    ]
})
export class NotFoundModule {
}
