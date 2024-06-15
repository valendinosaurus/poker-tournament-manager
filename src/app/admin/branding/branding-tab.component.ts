import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { AuthUtilService } from '../../shared/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { DEFAULT_DIALOG_POSITION } from '../../shared/const/app.const';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { Branding } from '../../shared/interfaces/branding.interface';
import { BrandingApiService } from '../../shared/services/api/branding-api.service';
import { CreateBrandingComponent } from './create-branding/create-branding.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-branding-tab',
    templateUrl: './branding-tab.component.html',
    styleUrls: ['./branding-tab.component.scss'],
    standalone: true,
    imports: [
        AsyncPipe,
        MatButtonModule,
        NgForOf,
        NgIf,
        RouterLink
    ]
})
export class BrandingTabComponent implements OnInit {

    brandings$: Observable<Branding[]>;

    private brandingApiService: BrandingApiService = inject(BrandingApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.brandings$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.brandingApiService.getAll$()),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    createBranding(): void {
        const ref = this.dialog.open(CreateBrandingComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                branding: null
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

    deleteBranding(branding: Branding, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Branding?',
                    body: `Do you really want to delete branding <strong>${branding.name}</strong>`,
                    confirm: 'Delete Branding',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.brandingApiService.delete$(branding.id).pipe(
                    take(1),
                    tap(() => this.trigger$.next())
                )),
                of(null)
            ))
        ).subscribe();
    }
}
