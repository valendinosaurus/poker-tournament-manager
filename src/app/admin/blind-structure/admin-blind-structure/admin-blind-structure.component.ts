import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { BlindStructure } from '../../../shared/interfaces/blind-structure.interface';
import { User } from '@auth0/auth0-angular';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { AuthUtilService } from '../../../shared/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { BlindStructureApiService } from '../../../shared/services/api/blind-structure-api.service';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { MatButtonModule } from '@angular/material/button';
import {
    BlindStructureViewComponent
} from '../../../shared/components/blind-structure-view/blind-structure-view.component';
import { AddPauseComponent } from '../../../dialogs/add-pause/add-pause.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddBlindsComponent } from '../../../dialogs/add-blinds/add-blinds.component';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { CreateBlindStructureComponent } from '../create-blind-structure/create-blind-structure.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';

@Component({
    selector: 'app-admin-blind-structure',
    templateUrl: './admin-blind-structure.component.html',
    standalone: true,
    imports: [
        RouterLink,
        AppHeaderComponent,
        AsyncPipe,
        MatButtonModule,
        BlindStructureViewComponent
    ]
})
export class AdminBlindStructureComponent implements OnInit {

    blindStructure$: Observable<BlindStructure>;
    user$: Observable<User>;
    sub$: Observable<string>;
    email$: Observable<string | undefined>;
    sId$: Observable<number>;

    private route: ActivatedRoute = inject(ActivatedRoute);
    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private trigger$: ReplaySubject<void> = new ReplaySubject<void>();
    private router: Router = inject(Router);
    private destroyRef: DestroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.user$ = this.authUtilService.getUser$();
        this.sub$ = this.authUtilService.getSub$();
        this.email$ = this.authUtilService.getEmail$();

        this.sId$ = this.route.paramMap.pipe(
            map((params: Params) => params.params.id),
            filter((id: string | null): id is string => id !== null),
            map((id: string) => +id)
        );

        this.blindStructure$ = combineLatest([
            this.trigger$,
            this.sId$
        ]).pipe(
            switchMap(([_, sId]: [void, number]) =>
                this.blindStructureApiService.get$(sId)
            )
        );

        this.trigger$.next();
    }

    lock(blindStructure: BlindStructure): void {
        this.blindStructureApiService.put$({
            ...blindStructure,
            structure: [],
            locked: true,
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    unlock(blindStructure: BlindStructure): void {
        this.blindStructureApiService.put$({
            ...blindStructure,
            structure: [],
            locked: false
        }).pipe(
            take(1),
            tap(() => this.trigger$.next()),
        ).subscribe();
    }

    addBlinds(structure: BlindStructure): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            data: {
                structure: structure
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    deleteBlindFromStructure(structure: BlindStructure, blindId: number): void {
        this.blindStructureApiService.removeBlind$(blindId, structure.id).pipe(
            take(1),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

    addPauseToStructure(structure: BlindStructure, position: number): void {
        if (position !== undefined) {
            const dialogRef = this.dialog.open(AddPauseComponent, {
                data: {
                    sId: structure.id,
                    position: position + 1
                }
            });

            dialogRef.afterClosed().pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.trigger$.next())
            ).subscribe();
        }
    }

    editStructure(structure: BlindStructure): void {
        const ref = this.dialog.open(CreateBlindStructureComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                structure: structure
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

    delete(structure: BlindStructure): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Delete Blind Structure?',
                    body: `Do you really want to delete blind structrue <strong>${structure.name}</strong>`,
                    confirm: 'Delete Blind Structure',
                    isDelete: true
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((confirmed) => iif(
                () => confirmed,
                defer(() => this.blindStructureApiService.delete$(structure.id).pipe(
                    take(1),
                    tap(() => this.router.navigate(['/admin/blind-structure']))
                )),
                of(null)
            ))
        ).subscribe();
    }

    updateStructure(levels: BlindLevel[], structure: BlindStructure): void {
        const blindIds: number[] = levels.map((e) => e.id);
        const positions: number[] = levels.map((e) => e.position);

        this.blindStructureApiService.deleteAllBlinds(structure.id).pipe(
            take(1),
            switchMap(() => this.blindStructureApiService.addBlinds$(
                blindIds,
                structure.id,
                positions
            )),
            tap(() => this.trigger$.next())
        ).subscribe();
    }

}
