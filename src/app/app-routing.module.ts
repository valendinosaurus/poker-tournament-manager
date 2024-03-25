import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/components/admin.component';
import { TimerPageComponent } from './timer/page/timer-page/timer-page.component';
import { SeriesPageComponent } from './series/page/series-page/series-page.component';
import { NotFoundPageComponent } from './not-found/not-found-page/not-found-page.component';
import { WelcomePageComponent } from './welcome/welcome-page/welcome-page.component';

const routes: Routes = [
    {
        path: 'home',
        component: WelcomePageComponent
    },
    {
        path: 'timer/:tId',
        component: TimerPageComponent
    },
    {
        path: 'test',
        component: TimerPageComponent
    },
    {
        path: 'series/:sId/:password',
        component: SeriesPageComponent
    },
    {
        path: 'admin',
        component: AdminComponent
    },
    {
        path: 'not-found',
        component: NotFoundPageComponent
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
