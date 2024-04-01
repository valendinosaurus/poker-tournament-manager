import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { BlindLevelModel } from '../../../../shared/models/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-create-blind-level',
    templateUrl: './create-blind-level.component.html',
    styleUrls: ['./create-blind-level.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule]
})
export class CreateBlindLevelComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: BlindLevelModel;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private triggerService: TriggerService = inject(TriggerService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: undefined,
            duration: 0,
            sb: 0,
            bb: 0,
            ante: 0,
            btnAnte: 0,
            isPause: false,
            isChipUp: false,
            endsRebuy: false
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultNumberField('duration', 'Duration', true),
            this.formlyFieldService.getDefaultNumberField('sb', 'SB', true),
            this.formlyFieldService.getDefaultNumberField('bb', 'BB', true),
            this.formlyFieldService.getDefaultNumberField('ante', 'Ante', true),
            this.formlyFieldService.getDefaultNumberField('btnAnte', 'Button Ante', true),
        ];
    }

    onSubmit(model: BlindLevelModel): void {
        this.blindLevelApiService.post$(model).pipe(
            take(1),
            tap(() => this.triggerService.triggerBlinds())
        ).subscribe();
    }

}
