import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../../../core/services/util/formly-field.service';
import { LocalStorageService } from '../../../../core/services/util/local-storage.service';
import { AdaptedPayout } from '../../../../shared/models/adapted-payout.interface';

@Component({
    selector: 'app-modify-payout',
    templateUrl: './modify-payout.component.html',
    styleUrls: ['./modify-payout.component.scss']
})
export class ModifyPayoutComponent implements OnInit {

    private dialogRef: MatDialogRef<ModifyPayoutComponent> = inject(MatDialogRef<ModifyPayoutComponent>);
    data: { pricepool: number, payouts: number[], tId: number } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    fields: FormlyFieldConfig[];
    model: { [key: string]: number } = {};

    toDistribute: number = 0;
    total: number = 0;
    keys: number[];

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    ngOnInit(): void {
        const pricePool = this.data.pricepool;
        this.fields = [];
        this.keys = [];
        this.total = this.data.pricepool;
        this.toDistribute = 0;

        this.data.payouts.forEach(
            (payout: number, index: number) => {
                this.keys.push(index);
                this.model[index] = payout;

                this.fields.push(
                    this.formlyFieldService.getDefaultNumberField(index.toString(), (index + 1).toString(), true)
                );
            });
    }

    modelChange(model: { [key: string]: number }): void {
        this.total = 0;

        this.keys.forEach(k => this.total += +model[k]);
        this.toDistribute = this.data.pricepool - this.total;
    }

    onSubmit(model: { [key: string]: number }): void {
        const payouts: number[] = [];
        const keys = Object.keys(model);

        keys.forEach((key) => payouts.push(+model[key]));

        const adaptedPayoutObject: AdaptedPayout = {
            tournamentId: this.data.tId,
            payouts: payouts
        };

        this.localStorageService.storeAdaptedPayout(adaptedPayoutObject);

        this.dialogRef.close();
    }
}
