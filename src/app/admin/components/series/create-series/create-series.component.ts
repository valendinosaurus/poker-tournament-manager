import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { Series } from '../../../../shared/models/series.interface';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';

@Component({
    selector: 'app-create-series',
    templateUrl: './create-series.component.html',
    styleUrls: ['./create-series.component.scss']
})
export class CreateSeriesComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: Series;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: undefined,
            name: '',
            shortDesc: '',
            longDesc: '',
            branding: 0,
            finalTournament: 0,
            rankFormula: 0,
            ftFormula: 0
        };
    }

    private initFields(): void {
        const brandings = [
            {
                label: 'dfasdfas', value: 0
            },
            {
                label: 'dfasdfa', value: 1
            },
            {
                label: 'fdsagfagds', value: 2
            }
        ];

        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('shortDesc', 'shortDesc', true, 200),
            this.formlyFieldService.getDefaultTextField('longDesc', 'longDesc', true, 1000),
            this.formlyFieldService.getDefaultSelectField('branding', 'branding', true, brandings),
            this.formlyFieldService.getDefaultNumberField('rankFormula', 'rankFormula', true),
            this.formlyFieldService.getDefaultNumberField('ftFormula', 'ftFormula', true),
        ];
    }

    onSubmit(model: Series): void {
        this.seriesApiService.post$(model).pipe(

        ).subscribe();
    }

}
