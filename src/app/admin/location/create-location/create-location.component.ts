import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationApiService } from '../../../shared/services/api/location-api.service';
import { Location, LocationModel } from '../../../shared/interfaces/location.interface';
import { catchError, take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseAddDialogComponent } from '../../../shared/components/base-add-dialog/base-add-dialog.component';
import { CreatePauseComponent } from '../../blind-level/create-pause/create-pause.component';
import { of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-create-location',
    templateUrl: './create-location.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ]
})
export class CreateLocationComponent extends BaseAddDialogComponent<CreatePauseComponent, LocationModel> implements OnInit {

    data: {
        location: Location | null;
    } = inject(MAT_DIALOG_DATA);

    private locationApiService: LocationApiService = inject(LocationApiService);

    ngOnInit(): void {
        this.initModel();
    }

    private initModel(): void {
        this.model = {
            id: signal(this.data?.location?.id ?? undefined),
            name: signal(this.data?.location?.name ?? ''),
            image: signal(this.data?.location?.image ?? ''),
            locked: signal(this.data?.location?.locked ?? false),
            isValid: computed(() =>
                this.model.name().length > 0 &&
                this.model.image().length > 0
            )
        };
    }

    onSubmit(): void {
        this.isLoadingAdd = true;
        const model: Location = {
            id: this.model.id() ?? -1,
            name: this.model.name(),
            image: this.model.image(),
            locked: this.model.locked()
        };

        if (this.data?.location) {
            this.locationApiService.put$(model).pipe(
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
            this.locationApiService.post$(model).pipe(
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
