import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlindLevelApiService } from '../../../shared/services/api/blind-level-api.service';
import { catchError, take, tap } from 'rxjs/operators';
import { BlindLevel, BlindLevelModel } from '../../../shared/interfaces/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseAddDialogComponent } from '../../../shared/components/base-add-dialog/base-add-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';

@Component({
    selector: 'app-create-blind-level',
    templateUrl: './create-blind-level.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
    ]
})
export class CreateBlindLevelComponent extends BaseAddDialogComponent<CreateBlindLevelComponent, BlindLevelModel> implements OnInit {

    data: {
        blindLevel: BlindLevel | null;
    } = inject(MAT_DIALOG_DATA);

    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);

    ngOnInit(): void {
        this.initModel();
    }

    private initModel(): void {
        this.model = {
            id: signal(this.data?.blindLevel?.id ?? undefined),
            duration: signal(Math.round(this.data?.blindLevel?.duration ?? 0)),
            sb: signal(Math.round(this.data?.blindLevel?.sb ?? 0)),
            bb: signal(Math.round(this.data?.blindLevel?.bb ?? 0)),
            ante: signal(Math.round(this.data?.blindLevel?.ante ?? 0)),
            btnAnte: signal(Math.round(this.data?.blindLevel?.btnAnte ?? 0)),
            isPause: signal(false),
            isChipUp: signal(false),
            endsRebuy: signal(false),
            isValid: computed(() =>
                this.model.duration() > 0 &&
                this.model.sb() > 0 &&
                this.model.bb() > 0 &&
                this.model.bb() > this.model.sb()
            )
        };
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        const model: BlindLevel = {
            id: this.model.id() ?? -1,
            duration: this.model.duration(),
            sb: this.model.sb(),
            bb: this.model.bb(),
            ante: this.model.ante(),
            btnAnte: this.model.btnAnte(),
            isPause: false,
            isChipUp: false,
            endsRebuy: false,
            position: -1
        };

        if (this.data?.blindLevel) {
            this.blindLevelApiService.put$(model).pipe(
                take(1),
                tap(() => {
                    this.dialogRef.close(true);
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        } else {
            this.blindLevelApiService.post$(model).pipe(
                take(1),
                tap(() => {
                    this.dialogRef.close(true);
                    this.isLoadingAdd = false;
                }),
                catchError(() => {
                    this.isLoadingAdd = false;
                    return of(null);
                })
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
