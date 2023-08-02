import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { Series } from '../../../../shared/models/series.interface';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';
import { BrandingApiService } from '../../../../core/services/api/branding-api.service';
import { Branding } from '../../../../shared/models/branding.interface';
import { tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';

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
    private brandingApiService: BrandingApiService = inject(BrandingApiService);
    private triggerService: TriggerService = inject(TriggerService);

    allBrandings: { label: string, value: number }[];

    ngOnInit(): void {
        this.brandingApiService.getAll$().pipe(
            tap((brandings: Branding[]) => {
                this.allBrandings = brandings.map(b => ({
                    label: b.name,
                    value: b.id ?? -1
                }));
                this.initModel();
                this.initFields();
            })
        ).subscribe();

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
            ftFormula: 0,
            percentage: 0,
            maxAmountPerTournament: 0
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('shortDesc', 'shortDesc', true, 200),
            this.formlyFieldService.getDefaultTextField('longDesc', 'longDesc', true, 1000),
            this.formlyFieldService.getDefaultSelectField('branding', 'branding', true, this.allBrandings),
            this.formlyFieldService.getDefaultNumberField('rankFormula', 'rankFormula', true),
            this.formlyFieldService.getDefaultNumberField('ftFormula', 'final table formula', true),
            this.formlyFieldService.getDefaultNumberField('percentage', '% of pot into final tournament', true),
            this.formlyFieldService.getDefaultNumberField('maxAmountPerTournament', 'Cap per Tournament', true),
        ];
    }

    onSubmit(model: Series): void {
        this.seriesApiService.post$(model).pipe(
            tap(() => this.triggerService.triggerSeriess())
        ).subscribe();
    }

}
