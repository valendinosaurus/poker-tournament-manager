import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../core/services/util/formly-field.service';
import { LocationApiService } from '../../../core/services/api/location-api.service';
import { Location, LocationModel } from '../../../shared/models/location.interface';
import { take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-create-location',
    templateUrl: './create-location.component.html',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf]
})
export class CreateLocationComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateLocationComponent> = inject(MatDialogRef<CreateLocationComponent>);

    data: {
        location?: Location;
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: LocationModel;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private locationApiService: LocationApiService = inject(LocationApiService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: this.data?.location?.id ?? undefined,
            name: this.data?.location?.name ?? '',
            image: this.data?.location?.image ?? '',
            locked: this.data?.location?.locked ?? false
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('image', 'Image', true, 1000),
        ];
    }

    onSubmit(model: LocationModel): void {
        if (this.data?.location) {
            this.locationApiService.put$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.locationApiService.post$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
