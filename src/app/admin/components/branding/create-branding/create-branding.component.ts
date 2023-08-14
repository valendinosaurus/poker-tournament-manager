import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { Branding } from '../../../../shared/models/branding.interface';
import { BrandingApiService } from '../../../../core/services/api/branding-api.service';
import { take } from 'rxjs/operators';
import { BrandingModel } from '../../../../shared/models/branding-model.interface';

@Component({
    selector: 'app-create-branding',
    templateUrl: './create-branding.component.html',
    styleUrls: ['./create-branding.component.scss']
})
export class CreateBrandingComponent implements OnInit {

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
            id: undefined,
            name: '',
            logo: '',
            description: ''
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('image', 'Image', true, 1000),
            this.formlyFieldService.getDefaultTextField('description', 'Description', true, 1000),
        ];
    }

    onSubmit(model: BrandingModel): void {
        this.brandingApiService.post$(model).pipe(
            take(1),
        ).subscribe();
    }

}
