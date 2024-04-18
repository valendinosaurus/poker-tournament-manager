import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../core/services/util/formly-field.service';
import { BlindLevelApiService } from '../../../core/services/api/blind-level-api.service';
import { take, tap } from 'rxjs/operators';
import { BlindLevel, BlindLevelModel } from '../../../shared/models/blind-level.interface';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-create-blind-level',
    templateUrl: './create-blind-level.component.html',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, FormlyModule, MatButtonModule, NgIf]
})
export class CreateBlindLevelComponent implements OnInit {

    private dialogRef: MatDialogRef<CreateBlindLevelComponent> = inject(MatDialogRef<CreateBlindLevelComponent>);

    data: {
        blindLevel?: BlindLevel;
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    model: BlindLevelModel;
    fields: FormlyFieldConfig[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);

    ngOnInit(): void {
        this.initModel();
        this.initFields();
    }

    private initModel(): void {
        this.model = {
            id: this.data?.blindLevel?.id ?? undefined,
            duration: Math.round(this.data?.blindLevel?.duration ?? 0),
            sb: Math.round(this.data?.blindLevel?.sb ?? 0),
            bb: Math.round(this.data?.blindLevel?.bb ?? 0),
            ante: Math.round(this.data?.blindLevel?.ante ?? 0),
            btnAnte: Math.round(this.data?.blindLevel?.btnAnte ?? 0),
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
