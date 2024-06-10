import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { Branding } from '../../../shared/interfaces/branding.interface';
import { User } from '@auth0/auth0-angular';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { BrandingApiService } from '../../../core/services/api/branding-api.service';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { CreateBrandingComponent } from '../create-branding/create-branding.component';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-admin-branding',
    standalone: true,
    imports: [CommonModule, AppHeaderComponent, MatButtonModule, RouterLink],
    templateUrl: './admin-branding.component.html',
})
export class AdminBrandingComponent implements OnInit {

    branding$: Observable<Branding>;
    user$: Observable<User>;
    sub$: Observable<string>;
    email$: Observable<string | undefined>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private brandingApiService: BrandingApiService = inject(BrandingApiService);
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

        this.branding$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) =>
                this.brandingApiService.get$(sId)
            )
        );

        this.trigger$.next();
    }

    editBranding(branding: Branding): void {
        const ref = this.dialog.open(CreateBrandingComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                branding: branding
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

    deleteBranding(branding: Branding): void {
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
                    tap(() => this.router.navigate(['/admin/branding']))
                )),
                of(null)
            ))
        ).subscribe();
    }

    lock(branding: Branding): void {
        this.brandingApiService.put$({
            ...branding,
            locked: true
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(branding: Branding): void {
        this.brandingApiService.put$({
            ...branding,
            locked: false
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

}
