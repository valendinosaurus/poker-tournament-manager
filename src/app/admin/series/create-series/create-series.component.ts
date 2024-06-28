import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SeriesApiService } from '../../../shared/services/api/series-api.service';
import { BrandingApiService } from '../../../shared/services/api/branding-api.service';
import { Branding } from '../../../shared/interfaces/branding.interface';
import { map, take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../shared/services/util/trigger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { CreateSeriesModel, Series, SeriesModel } from '../../../shared/interfaces/series.interface';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { RankingService } from '../../../shared/services/util/ranking.service';
import { RouterLink } from '@angular/router';
import { BaseAddDialogComponent } from '../../../shared/components/base-add-dialog/base-add-dialog.component';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-create-series',
    templateUrl: './create-series.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        AsyncPipe,
        MatOptionModule,
        MatSelectModule,
        MatCheckboxModule
    ]
})
export class CreateSeriesComponent extends BaseAddDialogComponent<CreateSeriesComponent, CreateSeriesModel> implements OnInit {

    data: {
        series: Series | null;
    } = inject(MAT_DIALOG_DATA);

    sub: string;

    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private brandingApiService: BrandingApiService = inject(BrandingApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private rankingService: RankingService = inject(RankingService);

    allBrandings$: Observable<{ label: string, value: number }[]>;
    formulas$: Observable<{ label: string, value: number | null }[]>;

    ngOnInit(): void {
        this.initModel();

        this.formulas$ = this.rankingService.getFormulasForSelect$();

        this.allBrandings$ = this.brandingApiService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            map((brandings: Branding[]) => brandings.map(b => ({
                    label: b.name,
                    value: b.id
                }))
            )
        );
    }

    private initModel(): void {
        this.model = {
            id: signal(this.data?.series?.id ?? undefined),
            name: signal(this.data?.series?.name ?? ''),
            shortDesc: signal(this.data?.series?.shortDesc ?? ''),
            longDesc: signal(this.data?.series?.longDesc ?? ''),
            branding: signal(this.data?.series?.branding.id ?? 0),
            finalTournament: signal(this.data?.series?.finalTournament.id ?? 0),
            rankFormula: signal(this.data?.series?.rankFormula.id ?? 0),
            ftFormula: signal(this.data?.series?.ftFormula ?? 0),
            percentage: signal(this.data?.series?.percentage ?? 0),
            maxAmountPerTournament: signal(this.data?.series?.maxAmountPerTournament ?? 0),
            noOfTournaments: signal(this.data?.series?.noOfTournaments ?? 0),
            finalists: signal(this.data?.series?.finalists ?? 0),
            password: signal(this.data?.series?.password ?? ''),
            temp: signal(this.data?.series?.temp ?? false),
            locked: signal(false),
            ownerEmail: signal(this.data?.series?.ownerEmail ?? ''),
            showPrices: signal(this.data?.series?.showPrices ?? true),
            showNonItmPlaces: signal(this.data?.series?.showNonItmPlaces ?? true),
            showEliminations: signal(this.data?.series?.showEliminations ?? true),
            showLiveTicker: signal(this.data?.series?.showLiveTicker ?? true),
            showAverageRank: signal(this.data?.series?.showAverageRank ?? true),
            isValid: computed(() =>
                this.model.name().length > 0
            )
        };
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        const model: SeriesModel = {
            id: this.model.id(),
            name: this.model.name(),
            shortDesc: this.model.shortDesc(),
            longDesc: this.model.longDesc(),
            branding: this.model.branding(),
            finalTournament: this.model.finalTournament(),
            rankFormula: this.model.rankFormula(),
            ftFormula: this.model.ftFormula(),
            percentage: this.model.percentage(),
            maxAmountPerTournament: this.model.maxAmountPerTournament(),
            noOfTournaments: this.model.noOfTournaments(),
            finalists: this.model.finalists(),
            password: this.model.password(),
            temp: this.model.temp(),
            locked: this.model.locked(),
            ownerEmail: this.model.ownerEmail(),
            showPrices: this.model.showPrices(),
            showNonItmPlaces: this.model.showNonItmPlaces(),
            showEliminations: this.model.showEliminations(),
            showLiveTicker: this.model.showLiveTicker(),
            showAverageRank: this.model.showAverageRank()
        };

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
