import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { SeriesDetails } from '../../../../shared/models/series-details.interface';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-series-list',
    templateUrl: './series-list.component.html',
    styleUrls: ['./series-list.component.scss']
})
export class SeriesListComponent implements OnInit {

    seriess$: Observable<SeriesDetails[]>;

    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.seriess$ = combineLatest([
            this.triggerService.getSeriesTrigger$(),
            this.authService.user$
        ]).pipe(
            map(([_trigger, user]: [void, User | undefined | null]) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            switchMap((sub: string) => this.seriesApiService.getAllWithDetails$(sub).pipe(
                // map((series) => series.map(t => ({
                //     ...t,
                // })))
            )),
            shareReplay(1)
        );
    }

    reload(): void {
        this.triggerService.triggerSeriess();
    }

}
