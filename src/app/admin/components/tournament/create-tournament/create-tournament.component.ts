import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';

@Component({
    selector: 'app-create-tournament',
    templateUrl: './create-tournament.component.html',
    styleUrls: ['./create-tournament.component.scss']
})
export class CreateTournamentComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: Tournament;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: undefined,
            name: '',
            date: new Date(),
            maxPlayers: 0,
            noOfTables: 0,
            startStack: 0,
            initialPricepool: 0,
            buyIn: 0,
            noOfRebuys: 0,
            rebuy: 0,
            addonAmount: 0,
            addon: 0,
            payout: '',
            location: -1,
            entries: [],
            structure: [],
            players: [],
            finishes: []
        };
    }

    private initFields(): void {
        const locations = [
            {label: 'Location 1', value: 1},
            {label: 'Location 2', value: 2},
            {label: 'Location 3', value: 3},
            {label: 'Location 4', value: 4},
        ];

        this.fields = [
            this.formlyFieldService.getDefaultTextField('name', 'Name', true, 100),
            this.formlyFieldService.getDefaultDateField('date', 'Date', true),
            this.formlyFieldService.getDefaultNumberField('maxPlayers', 'max Players', true),
            this.formlyFieldService.getDefaultNumberField('noOfTables', 'no of tables', true),
            this.formlyFieldService.getDefaultNumberField('startStack', 'start stack', true),
            this.formlyFieldService.getDefaultNumberField('initialPricepool', 'initial pricepool', true),
            this.formlyFieldService.getDefaultNumberField('buyIn', 'buy-in', true),
            this.formlyFieldService.getDefaultNumberField('noOfRebuys', 'no of rebuys', true),
            this.formlyFieldService.getDefaultNumberField('rebuy', 'rebuy amount', true),
            this.formlyFieldService.getDefaultNumberField('addonAmount', 'addon chips', true),
            this.formlyFieldService.getDefaultNumberField('addon', 'addon amount', true),
            this.formlyFieldService.getDefaultTextField('payout', 'payout structure', true, 1000),
            this.formlyFieldService.getDefaultSelectField('location', 'location', true, locations),
        ];
    }

    onSubmit(model: Tournament): void {
        this.tournamentApiService.post$(model).pipe(

        ).subscribe();
    }
}
