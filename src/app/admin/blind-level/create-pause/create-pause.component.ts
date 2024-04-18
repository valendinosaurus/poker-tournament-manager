import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../core/services/util/formly-field.service';
import { BlindLevelApiService } from '../../../core/services/api/blind-level-api.service';
import { take, tap } from 'rxjs/operators';
import { TriggerService } from '../../../core/services/util/trigger.service';
import { BlindLevel, BlindLevelModel } from '../../../shared/models/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-create-pause',
    templateUrl: './create-pause.component.html',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf]
})
export class CreatePauseComponent implements OnInit {

    private dialogRef: MatDialogRef<CreatePauseComponent> = inject(MatDialogRef<CreatePauseComponent>);

    data: {
        blindLevel?: BlindLevel;
    } = inject(MAT_DIALOG_DATA);

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
            id: this.data?.blindLevel?.id ?? undefined,
            duration: Math.round(this.data?.blindLevel?.duration ?? 0),
            sb: 0,
            bb: 0,
            ante: 0,
            btnAnte: 0,
            isPause: true,
            isChipUp: this.data?.blindLevel?.isChipUp ?? false,
            endsRebuy: this.data?.blindLevel?.endsRebuy ?? false
        };
    }

    private initFields(): void {
        this.fields = [
            this.formlyFieldService.getDefaultNumberField('duration', 'Duration', true),
            this.formlyFieldService.getDefaultCheckboxField('isChipUp', 'Chip-Up?'),
            this.formlyFieldService.getDefaultCheckboxField('endsRebuy', 'ends rebuy / re-entry?')
        ];
    }

    onSubmit(model: BlindLevelModel): void {
        if (this.data?.blindLevel) {
            this.blindLevelApiService.put$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        } else {
            this.blindLevelApiService.post$(model).pipe(
                take(1),
                tap(() => this.dialogRef.close(true))
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

}
