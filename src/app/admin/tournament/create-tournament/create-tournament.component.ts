import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../shared/services/util/formly-field.service';
import { TournamentApiService } from '../../../shared/services/api/tournament-api.service';
import { RankingService } from '../../../shared/services/util/ranking.service';
import { take, tap } from 'rxjs/operators';
import { LocationApiService } from '../../../shared/services/api/location-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { Tournament, TournamentModel } from '../../../shared/interfaces/tournament.interface';
import { TriggerService } from '../../../shared/services/util/trigger.service';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
    selector: 'app-create-tournament',
    templateUrl: './create-tournament.component.html',
    standalone: true,
    imports: [
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        FormlyModule,
        MatButtonModule,
        MatStepperModule,
        MatDatepickerModule
    ],
})
export class CreateTournamentComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateTournamentComponent> = inject(MatDialogRef<CreateTournamentComponent>);

    data: {
        tournament: Tournament | null;
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: TournamentModel;
    fields: FormlyFieldConfig[];

    allLocations: { label: string, value: number }[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private rankingService: RankingService = inject(RankingService);
    private locationService: LocationApiService = inject(LocationApiService);
    private destroyRef = inject(DestroyRef);
    private triggerService: TriggerService = inject(TriggerService);

    ngOnInit(): void {
        this.locationService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((locations) => {
                this.allLocations = locations.map(l => ({label: l.name, value: l.id}));
                this.initModel();
                this.initFields();
            })
        ).subscribe();

    }

    private initModel(): void {
        this.model = {
            id: this.data?.tournament?.id ?? undefined,
            name: this.data?.tournament?.name ?? '',
            date: this.data?.tournament?.date ? new Date(this.data.tournament.date).toISOString() : new Date().toISOString(),
            maxPlayers: this.data?.tournament?.maxPlayers ?? 0,
            startStack: this.data?.tournament?.startStack ?? 0,
            initialPricePool: this.data?.tournament?.initialPricePool ?? 0,
            buyInAmount: this.data?.tournament?.buyInAmount ?? 0,
            noOfRebuys: this.data?.tournament?.noOfRebuys ?? 0,
            rebuyAmount: this.data?.tournament?.rebuyAmount ?? 0,
            addonStack: this.data?.tournament?.addonStack ?? 0,
            noOfReEntries: this.data?.tournament?.noOfReEntries ?? 0,
            addonAmount: this.data?.tournament?.addonAmount ?? 0,
            withRebuy: this.data?.tournament?.withRebuy ?? false,
            withAddon: this.data?.tournament?.withAddon ?? false,
            withReEntry: this.data?.tournament?.withReEntry ?? false,
            rebuyStack: this.data?.tournament?.rebuyStack ?? 0,
            payout: this.data?.tournament?.payout ?? 0,
            rankFormula: this.data?.tournament?.rankFormula ?? null,
            location: this.data?.tournament?.location ?? this.allLocations[0].value,
            temp: this.data?.tournament?.temp ?? false,
            password: '',
            locked: false,
            adaptedPayout: undefined
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultDateField('date', 'Date', true),
            this.formlyFieldService.getDefaultNumberField('maxPlayers', 'max Players', true),
            this.formlyFieldService.getDefaultNumberField('buyInAmount', 'buy-in', true),
            this.formlyFieldService.getDefaultNumberField('startStack', 'start stack', true),
            this.formlyFieldService.getDefaultCheckboxField('withReEntry', 'with Re-Entry'),
            {
                className: 'sub-group',
                fieldGroup: [
                    this.formlyFieldService.getDefaultNumberField('noOfReEntries', 'no of re-entries', true),
                ],
                expressions: {
                    hide: () => !this.model.withReEntry
                }
            },
            this.formlyFieldService.getDefaultCheckboxField('withRebuy', 'with Rebuy'),
            {
                className: 'sub-group',
                fieldGroup: [
                    this.formlyFieldService.getDefaultNumberField('noOfRebuys', 'no of rebuys', true),
                    this.formlyFieldService.getDefaultNumberField('rebuyAmount', 'rebuy amount', true),
                    this.formlyFieldService.getDefaultNumberField('rebuyStack', 'rebuy stack', true),
                ],
                expressions: {
                    hide: () => !this.model.withRebuy
                }
            },
            this.formlyFieldService.getDefaultCheckboxField('withAddon', 'with Addon'),
            {
                className: 'sub-group',
                fieldGroup: [
                    this.formlyFieldService.getDefaultNumberField('addonAmount', 'addon amount', true),
                    this.formlyFieldService.getDefaultNumberField('addonStack', 'addon chips', true),
                ],
                expressions: {
                    hide: () => !this.model.withAddon
                }
            },
            this.formlyFieldService.getDefaultNumberField('initialPricePool', 'initial pricepool', true),
            this.formlyFieldService.getDefaultSelectField('payout', 'payout structure', true, this.rankingService.getAllPayoutsForSelect()),
            this.formlyFieldService.getDefaultSelectField('rankFormula', 'rankFormula', false, this.rankingService.getFormulasForSelect()),
            this.formlyFieldService.getDefaultSelectField('location', 'location', true, this.allLocations),
            this.formlyFieldService.getDefaultCheckboxField('temp', 'Test Tournament?'),
            this.formlyFieldService.getDefaultTextField('password', 'Password', false, 100),
        ];
    }

    onSubmit(model: TournamentModel): void {
        if (this.data?.tournament) {
            this.tournamentApiService.put$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerTournaments()),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.tournamentApiService.post$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerTournaments()),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
