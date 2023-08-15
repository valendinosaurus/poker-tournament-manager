import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { SeriesApiService } from '../../../../core/services/api/series-api.service';
import { BrandingApiService } from '../../../../core/services/api/branding-api.service';
import { Branding } from '../../../../shared/models/branding.interface';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';
import { SeriesModel } from '../../../../shared/models/series-model.interface';

@Component({
    selector: 'app-create-series',
    templateUrl: './create-series.component.html',
    styleUrls: ['./create-series.component.scss']
})
export class CreateSeriesComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: SeriesModel;
    fields: FormlyFieldConfig[];
    sub: string;

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private brandingApiService: BrandingApiService = inject(BrandingApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    allBrandings: { label: string, value: number }[];

    ngOnInit(): void {
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            tap((sub: string) => this.sub = sub),
            switchMap((sub: string) => this.brandingApiService.getAll$(sub).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((brandings: Branding[]) => {
                    this.allBrandings = brandings.map(b => ({
                        label: b.name,
                        value: b.id
                    }));
                    this.initModel();
                    this.initFields();
                })
            ))
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
            maxAmountPerTournament: 0,
            noOfTournaments: 0,
            finalists: 0,
            sub: this.sub,
            password: ''
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
            this.formlyFieldService.getDefaultNumberField('noOfTournaments', 'Cap per Tournament', true),
            this.formlyFieldService.getDefaultNumberField('finalists', 'Cap per Tournament', true),
            this.formlyFieldService.getDefaultTextField('password', 'password', false, 1000),
        ];
    }

    onSubmit(model: SeriesModel): void {
        this.seriesApiService.post$(model).pipe(
            take(1),
            tap(() => this.triggerService.triggerSeriess())
        ).subscribe();
    }

}
