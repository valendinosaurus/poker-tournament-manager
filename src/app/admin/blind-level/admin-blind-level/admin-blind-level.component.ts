import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { User } from '@auth0/auth0-angular';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AuthUtilService } from '../../../core/services/auth-util.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { BlindLevelApiService } from '../../../core/services/api/blind-level-api.service';
import { DEFAULT_DIALOG_POSITION } from '../../../core/const/app.const';
import { CreateBlindLevelComponent } from '../create-blind-level/create-blind-level.component';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { CreatePauseComponent } from '../create-pause/create-pause.component';

@Component({
    selector: 'app-admin-blind-level',
    standalone: true,
    imports: [CommonModule, AppHeaderComponent, MatButtonModule, UserImageRoundComponent, RouterLink],
    templateUrl: './admin-blind-level.component.html'
})
export class AdminBlindLevelComponent implements OnInit {

    blindLevel$: Observable<BlindLevel>;
    user$: Observable<User>;
    sub$: Observable<string>;
    email$: Observable<string | undefined>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
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

        this.blindLevel$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) =>
                this.blindLevelApiService.get$(sId)
            )
        );

        this.trigger$.next();
    }

    editBlindLevel(blindLevel: BlindLevel): void {
        let ref: MatDialogRef<CreateBlindLevelComponent | CreatePauseComponent>;

        if (blindLevel.isPause) {
            ref = this.dialog.open(
                CreatePauseComponent,
                {
                    ...DEFAULT_DIALOG_POSITION,
                    data: {
                        blindLevel: blindLevel
                    }
                });
        } else {
            ref = this.dialog.open(
                CreateBlindLevelComponent,
                {
                    ...DEFAULT_DIALOG_POSITION,
                    data: {
                        blindLevel: blindLevel
                    }
                });
        }

        ref.afterClosed().pipe(
            take(1),
            tap((e) => {
                if (e) {
                    this.trigger$.next();
                }
            })
        ).subscribe();
    }

    deleteBlindLevel(blindLevel: BlindLevel): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Blind Level?',
                    body: `Do you really want to delete blind level <strong>${blindLevel.sb} / ${blindLevel.bb} (${blindLevel.duration} min)</strong>`,
                    confirm: 'Delete Blind Level',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            take(1),
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.authUtilService.getSub$().pipe(
                    switchMap((sub: string) => this.blindLevelApiService.delete$(blindLevel.id, sub).pipe(
                        take(1),
                        tap(() => this.router.navigate(['/admin/blind-level']))
                    ))
                )),
                of(null)
            ))
        ).subscribe();
    }

}
