import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SeriesDetails } from '../../../../shared/models/series-details.interface';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { shareReplay, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-series-list',
    templateUrl: './series-list.component.html',
    styleUrls: ['./series-list.component.scss']
})
export class SeriesListComponent implements OnInit {

    seriess$: Observable<SeriesDetails[]>;

    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private triggerService: TriggerService = inject(TriggerService);

    ngOnInit(): void {
        this.seriess$ = this.triggerService.getSeriesTrigger$().pipe(
            switchMap(() => this.seriesApiService.getAllWithDetails$().pipe(
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
