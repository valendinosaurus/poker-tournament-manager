import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/components/admin.component';
import { TimerPageComponent } from './timer/page/timer-page/timer-page.component';

const routes: Routes = [
    {
        path: 'timer/:tId',
        component: TimerPageComponent
    },
    {
        path: 'timer',
        component: TimerPageComponent
    },
    {
        path: 'admin',
        component: AdminComponent
    },
    {
        path: '',
        redirectTo: 'timer',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
