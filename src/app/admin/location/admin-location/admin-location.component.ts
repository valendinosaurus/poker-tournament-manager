import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Location } from '../../../shared/models/location.interface';
import { User } from '@auth0/auth0-angular';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { LocationApiService } from '../../../core/services/api/location-api.service';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { CreateLocationComponent } from '../create-location/create-location.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-admin-location',
    standalone: true,
    imports: [CommonModule, AppHeaderComponent, MatButtonModule, RouterLink],
    templateUrl: './admin-location.component.html',
})
export class AdminLocationComponent implements OnInit {

    location$: Observable<Location>;
    user$: Observable<User>;
    sub$: Observable<string>;
    email$: Observable<string | undefined>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private locationApiService: LocationApiService = inject(LocationApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private router: Router = inject(Router);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();
        this.email$ = this.authUtilService.getEmail$();

        this.sId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.location$ = combineLatest([
            this.trigger$,
            this.sId$,
            this.sub$
        ]).pipe(
            switchMap(([_, sId, sub]: [void, number, string]) =>
                this.locationApiService.get$(sId, sub)
            )
        );

        this.trigger$.next();
    }

    editLocation(location: Location): void {
        const ref = this.dialog.open(CreateLocationComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                location: location
            }
        });

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    deleteLocation(location: Location): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Location?',
                    body: `Do you really want to delete location <strong>${location.name} min)</strong>`,
                    confirm: 'Delete Location',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.authUtilService.getSub$().pipe(
                    switchMap((sub: string) => this.locationApiService.delete$(location.id, sub).pipe(
                        take(1),
                        tap(() => this.router.navigate(['/admin/location']))
                    ))
                )),
                of(null)
            ))
        ).subscribe();
    }

    lock(location: Location): void {
        this.locationApiService.put$({
            ...location,
            locked: true
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(location: Location): void {
        this.locationApiService.put$({
            ...location,
            locked: false
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

}
