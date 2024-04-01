import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CreateSeriesComponent } from './create-series/create-series.component';
import {
    PageWithSlideMenuComponent
} from '../../../shared/components/page-with-slide-menu/page-with-slide-menu.component';
import { MatButtonModule } from '@angular/material/button';
import { Observable, ReplaySubject } from 'rxjs';
import { AdminSeries } from '../../../shared/models/admin-series.interface';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-series-tab',
    templateUrl: './series-tab.component.html',
    styleUrls: ['./series-tab.component.scss'],
    standalone: true,
    imports: [
        PageWithSlideMenuComponent,
        CreateSeriesComponent,
        MatButtonModule,
        AsyncPipe,
        DatePipe,
        NgForOf,
        NgIf,
        RouterLink
    ]
})
export class SeriesTabComponent implements OnInit {

    series$: Observable<AdminSeries[]>;

    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private router: Router = inject(Router);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.series$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.authUtilService.getSub$()),
            switchMap((sub: string) => this.seriesApiService.getForAdmin$(sub)),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    reload(): void {
        this.trigger$.next();
    }

    deleteSeries(tId: number): void {
        this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.seriesApiService.delete$(tId, sub).pipe(
                take(1),
                tap(() => this.reload())
            ))
        ).subscribe();
    }

    openSeries(tId: number): void {
        const link = this.router.serializeUrl(this.router.createUrlTree(['timer', tId]));
        window.open(link, '_blank');
    }

    createSeries(): void {
        this.dialog.open(CreateSeriesComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
        });
    }

}
