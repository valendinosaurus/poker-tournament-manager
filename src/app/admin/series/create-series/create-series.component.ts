import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../shared/services/util/formly-field.service';
import { SeriesApiService } from '../../../shared/services/api/series-api.service';
import { BrandingApiService } from '../../../shared/services/api/branding-api.service';
import { Branding } from '../../../shared/interfaces/branding.interface';
import { take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../shared/services/util/trigger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Series, SeriesModel } from '../../../shared/interfaces/series.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { RankingService } from '../../../shared/services/util/ranking.service';

@Component({
    selector: 'app-create-series',
    templateUrl: './create-series.component.html',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf]
})
export class CreateSeriesComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateSeriesComponent> = inject(MatDialogRef<CreateSeriesComponent>);

    data: {
        series: Series | null;
    } = inject(MAT_DIALOG_DATA);

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
    private rankingService: RankingService = inject(RankingService);

    allBrandings: { label: string, value: number }[];

    ngOnInit(): void {
        this.brandingApiService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((brandings: Branding[]) => {
                this.allBrandings = brandings.map(b => ({
                    label: b.name,
                    value: b.id
                }));
                this.initModel();
                this.initFields();
            })
        ).subscribe();

    }

    private initModel(): void {
        this.model = {
            id: this.data?.series?.id ?? undefined,
            name: this.data?.series?.name ?? '',
            shortDesc: this.data?.series?.shortDesc ?? '',
            longDesc: this.data?.series?.longDesc ?? '',
            branding: this.data?.series?.branding.id ?? 0,
            finalTournament: this.data?.series?.finalTournament.id ?? 0,
            rankFormula: this.data?.series?.rankFormula.id ?? 0,
            ftFormula: this.data?.series?.ftFormula ?? 0,
            percentage: this.data?.series?.percentage ?? 0,
            maxAmountPerTournament: this.data?.series?.maxAmountPerTournament ?? 0,
            noOfTournaments: this.data?.series?.noOfTournaments ?? 0,
            finalists: this.data?.series?.finalists ?? 0,
            password: this.data?.series?.password ?? '',
            temp: this.data?.series?.temp ?? false,
            locked: false,
            ownerEmail: this.data?.series?.ownerEmail ?? '',
            showPrices: this.data?.series?.showPrices ?? true,
            showNonItmPlaces: this.data?.series?.showNonItmPlaces ?? true,
            showEliminations: this.data?.series?.showEliminations ?? true,
            showLiveTicker: this.data?.series?.showLiveTicker ?? true,
            showAverageRank: this.data?.series?.showAverageRank ?? true,
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultTextField('shortDesc', 'Short Description', true, 200),
            this.formlyFieldService.getDefaultTextField('longDesc', 'Long Description', true, 1000),
            this.formlyFieldService.getDefaultSelectField('branding', 'Branding', true, this.allBrandings),
            this.formlyFieldService.getDefaultSelectField('rankFormula', 'rankFormula', false, this.rankingService.getFormulasForSelect$()),
            this.formlyFieldService.getDefaultNumberField('ftFormula', 'Formula: Final Table', true),
            this.formlyFieldService.getDefaultNumberField('percentage', '% of Pot into Final Tournament', true),
            this.formlyFieldService.getDefaultNumberField('maxAmountPerTournament', 'Cap per Tournament', true),
            this.formlyFieldService.getDefaultNumberField('noOfTournaments', 'Number of Tournaments', true),
            this.formlyFieldService.getDefaultNumberField('finalists', 'Number of Finalists', true),
            this.formlyFieldService.getDefaultTextField('password', 'Password', false, 1000),
            this.formlyFieldService.getDefaultCheckboxField('temp', 'Test Series?'),
            this.formlyFieldService.getDefaultCheckboxField('showPrices', 'Show Prices in Leaderboard?', true),
            this.formlyFieldService.getDefaultCheckboxField('showNonItmPlaces', 'Show Places not ITM?', true),
            this.formlyFieldService.getDefaultCheckboxField('showEliminations', 'Show Eliminations?', true),
            this.formlyFieldService.getDefaultCheckboxField('showLiveTicker', 'Show Live Ticker?', true),
            this.formlyFieldService.getDefaultCheckboxField('showAverageRank', 'Show Average Rank?', true),
            this.formlyFieldService.getDefaultTextField('ownerEmail', 'Owner\'s Email', false, 200),
        ];
    }

    onSubmit(model: SeriesModel): void {
        if (this.data?.series) {
            this.seriesApiService.put$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerSeriess()),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.seriesApiService.post$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerSeriess()),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
