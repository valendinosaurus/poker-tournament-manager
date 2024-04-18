import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CreateLocationComponent } from './create-location/create-location.component';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Location } from '../../shared/models/location.interface';
import { LocationApiService } from '../../core/services/api/location-api.service';
import { AuthUtilService } from '../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { DEFAULT_DIALOG_POSITION } from '../../core/const/app.const';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { AsyncPipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-location-tab',
    templateUrl: './location-tab.component.html',
    styleUrls: ['./location-tab.component.scss'],
    standalone: true,
    imports: [CreateLocationComponent, AsyncPipe, DecimalPipe, MatButtonModule, NgForOf, NgIf, RouterLink]
})
export class LocationTabComponent implements OnInit {

    locations$: Observable<Location[]>;

    private locationApiService: LocationApiService = inject(LocationApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.locations$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.locationApiService.getAll$()),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    createLocation(): void {
        const ref = this.dialog.open(CreateLocationComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh'
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

    deleteLocation(location: Location, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Location?',
                    body: `Do you really want to delete location <strong>${location.name}</strong>`,
                    confirm: 'Delete Location',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.locationApiService.delete$(location.id).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )),
                of(null)
            ))
        ).subscribe();
    }
}
