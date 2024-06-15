import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../shared/services/util/formly-field.service';
import { Branding, BrandingModel } from '../../../shared/interfaces/branding.interface';
import { BrandingApiService } from '../../../shared/services/api/branding-api.service';
import { take, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-create-branding',
    templateUrl: './create-branding.component.html',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf]
})
export class CreateBrandingComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateBrandingComponent> = inject(MatDialogRef<CreateBrandingComponent>);

    data: {
        branding: Branding | null;
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: BrandingModel;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private brandingApiService: BrandingApiService = inject(BrandingApiService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: this.data?.branding?.id ?? undefined,
            name: this.data?.branding?.name ?? '',
            logo: this.data?.branding?.logo ?? '',
            description: this.data?.branding?.description ?? '',
            locked: this.data?.branding?.locked ?? false
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('logo', 'Logo', true, 1000),
            this.formlyFieldService.getDefaultTextField('description', 'Description', true, 1000),
        ];
    }

    onSubmit(model: BrandingModel): void {
        if (this.data?.branding) {
            this.brandingApiService.put$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.brandingApiService.post$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
