import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { defer, iif, Observable, of, ReplaySubject } from 'rxjs';
import { BlindStructure } from '../../../shared/interfaces/blind-structure.interface';
import { BlindStructureApiService } from '../../../shared/services/api/blind-structure-api.service';
import { AuthUtilService } from '../../../shared/services/auth-util.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { DEFAULT_DIALOG_POSITION } from '../../../shared/const/app.const';
import { CreateBlindStructureComponent } from '../create-blind-structure/create-blind-structure.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-blind-structure-tab',
    templateUrl: './blind-structure-tab.component.html',
    standalone: true,
    imports: [
        MatButtonModule,
        RouterLink,
        AsyncPipe
    ]
})
export class BlindStructureTabComponent implements OnInit {

    blindStructures$: Observable<BlindStructure[]>;

    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private trigger$: ReplaySubject<void>;

    ngOnInit(): void {
        this.trigger$ = new ReplaySubject<void>();

        this.blindStructures$ = this.trigger$.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() => this.blindStructureApiService.getAll$()),
            shareReplay(1)
        );

        this.trigger$.next();
    }

    createBlindStructure(): void {
        const ref = this.dialog.open(CreateBlindStructureComponent, {
            ...DEFAULT_DIALOG_POSITION,
            height: '80vh',
            data: {
                structure: null
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

    deleteStructure(structure: BlindStructure, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

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
                    tap(() => this.trigger$.next())
                )),
                of(null)
            ))
        ).subscribe();
    }

}
