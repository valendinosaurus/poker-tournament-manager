import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { LocationApiService } from '../../../../core/services/api/location-api.service';
import { Location } from '../../../../shared/models/location.interface';
import { take } from 'rxjs/operators';
import { LocationModel } from '../../../../shared/models/location-model.interface';

@Component({
    selector: 'app-create-location',
    templateUrl: './create-location.component.html',
    styleUrls: ['./create-location.component.scss']
})
export class CreateLocationComponent implements OnInit {

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
            id: undefined,
            name: '',
            image: '',
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('image', 'Image', true, 1000),
        ];
    }

    onSubmit(model: LocationModel): void {
        this.locationApiService.post$(model).pipe(
            take(1)
        ).subscribe();
    }

}
