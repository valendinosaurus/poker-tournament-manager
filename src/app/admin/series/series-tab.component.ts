import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CreateSeriesComponent } from './create-series/create-series.component';
import {
    PageWithSlideMenuComponent
} from '../../shared/components/page-with-slide-menu/page-with-slide-menu.component';
import { MatButtonModule } from '@angular/material/button';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { AdminSeries } from '../../shared/interfaces/admin-series.interface';
import { SeriesApiService } from '../../shared/services/api/series-api.service';
import { AuthUtilService } from '../../shared/services/auth-util.service';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DEFAULT_DIALOG_POSITION } from '../../shared/const/app.const';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-series-tab',
    templateUrl: './series-tab.component.html',
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
            switchMap(() => this.seriesApiService.getForAdmin$()),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    deleteSeries(series: AdminSeries, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Series?',
                    body: `Do you really want to delete series <strong>${series.name}</strong>`,
                    confirm: 'Delete Series',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.seriesApiService.delete$(series.id).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )),
                of(null)
            ))
        ).subscribe();
    }

    openSeries(sId: number, password: string): void {
        const link = this.router.serializeUrl(this.router.createUrlTree(['series', sId, password]));
        window.open(link, '_blank');
    }

    createSeries(): void {
        const dialogRef = this.dialog.open(CreateSeriesComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                series: null
            }
        });

        dialogRef.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

}
