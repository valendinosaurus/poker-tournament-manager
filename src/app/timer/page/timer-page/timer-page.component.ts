import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { TimerComponent } from '../../components/tournament/timer/timer.component';
import { MatDialogModule } from '@angular/material/dialog';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { AuthUtilService } from '../../../core/services/auth-util.service';

@Component({
    selector: 'app-timer-page',
    templateUrl: './timer-page.component.html',
    styleUrls: ['./timer-page.component.scss'],
    standalone: true,
    imports: [TimerComponent, AsyncPipe, MatDialogModule, AppHeaderComponent]
})
export class TimerPageComponent implements OnInit {

    config$: Observable<{
        sub: string | undefined,
        password: string | undefined,
        tournamentId: number | undefined
    }>;

    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private route: ActivatedRoute = inject(ActivatedRoute);

    ngOnInit() {
        this.config$ = this.authUtilService.getSub$().pipe(
            map((sub: string) => ({
                sub,
                password: this.route.snapshot.params['password'],
                tournamentId: this.route.snapshot.params['tId']
            }))
        );
    }

}
