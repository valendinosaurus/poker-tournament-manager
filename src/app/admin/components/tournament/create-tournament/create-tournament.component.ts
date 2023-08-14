import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { Tournament } from '../../../../shared/models/tournament.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { RankingService } from '../../../../core/services/util/ranking.service';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { LocationApiService } from '../../../../core/services/api/location-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';
import { TournamentModel } from '../../../../shared/models/tournament-model.interface';

@Component({
    selector: 'app-create-tournament',
    templateUrl: './create-tournament.component.html',
    styleUrls: ['./create-tournament.component.scss']
})
export class CreateTournamentComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: TournamentModel;
    fields: FormlyFieldConfig[];

    allLocations: { label: string, value: number }[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private rankingService: RankingService = inject(RankingService);
    private locationService: LocationApiService = inject(LocationApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private destroyRef = inject(DestroyRef);
    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            switchMap((sub: string) => this.locationService.getAll$(sub).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((locations) => {
                    this.allLocations = locations.map(l => ({label: l.name, value: l.id}));
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
            date: new Date(),
            maxPlayers: 0,
            startStack: 0,
            initialPricePool: 0,
            buyInAmount: 0,
            noOfRebuys: 0,
            rebuyAmount: 0,
            addonStack: 0,
            noOfReEntries: 0,
            addonAmount: 0,
            withRebuy: false,
            withAddon: false,
            withReEntry: false,
            rebuyStack: 0,
            payout: 0,
            rankFormula: null,
            location: -1,
            entries: [],
            structure: [],
            players: [],
            finishes: []
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
        ];
    }

    onSubmit(model: TournamentModel): void {
        this.tournamentApiService.post$(model).pipe(
            take(1),
            tap(() => this.triggerService.triggerTournaments())
        ).subscribe();
    }
}
