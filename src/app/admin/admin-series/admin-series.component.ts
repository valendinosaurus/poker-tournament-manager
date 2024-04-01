import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { UserImageRoundComponent } from '../../shared/components/user-image-round/user-image-round.component';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AuthUtilService } from '../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { SeriesApiService } from '../../core/services/api/series-api.service';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AddTournamentComponent } from '../../dialogs/add-tournament/add-tournament.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Series } from '../../shared/models/series.interface';

@Component({
    selector: 'app-admin-series',
    standalone: true,
    imports: [CommonModule, AppHeaderComponent, MatButtonModule, MatTabsModule, UserImageRoundComponent, RouterLink],
    templateUrl: './admin-series.component.html',
    styleUrls: ['./admin-series.component.scss']
})
export class AdminSeriesComponent implements OnInit {

    series$: Observable<Series>;
    user$: Observable<User>;
    sub$: Observable<string>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private router: Router = inject(Router);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();

        this.sId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.series$ = combineLatest([
            this.trigger$,
            this.sId$,
            this.sub$
        ]).pipe(
            switchMap(([_, sId, sub]: [void, number, string]) =>
                this.seriesApiService.get$(sId, sub)
            )
        );

        this.trigger$.next();
    }

    editSeries(series: Series): void {

    }

    addTournament(series: Series): void {
        const dialogRef = this.dialog.open(AddTournamentComponent, {
            data: {
                series: series
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    deleteSeries(series: Series): void {
        this.sub$.pipe(
            switchMap((sub: string) => this.seriesApiService.delete$(series.id, sub).pipe(
                take(1),
                tap(() => this.trigger$.next())
            ))
        ).subscribe();
    }

    deleteTournamentFromSeries(series: Series, tournamentId: number): void {
        this.seriesApiService.removeTournament$(tournamentId, series.id).pipe(
            take(1),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    openSeries(series: Series): void {
        this.router.navigate(['series', series.id, series.password]);
    }

}
