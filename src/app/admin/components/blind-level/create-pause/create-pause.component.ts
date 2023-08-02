import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../../core/services/util/trigger.service';

@Component({
    selector: 'app-create-pause',
    templateUrl: './create-pause.component.html',
    styleUrls: ['./create-pause.component.scss']
})
export class CreatePauseComponent implements OnInit {

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: BlindLevel;
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
            isPause: true,
            isChipUp: false,
            endsRebuyReentry: false
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultNumberField('duration', 'Duration', true),
            this.formlyFieldService.getDefaultCheckboxField('isChipUp', 'Chip-Up?'),
            this.formlyFieldService.getDefaultCheckboxField('endsRebuyReentry', 'ends rebuy / re-entry?')
        ];
    }

    onSubmit(model: BlindLevel): void {
        this.blindLevelApiService.post$(model).pipe(
            take(1),
            tap(() => this.triggerService.triggerBlinds())
        ).subscribe();
    }

}
