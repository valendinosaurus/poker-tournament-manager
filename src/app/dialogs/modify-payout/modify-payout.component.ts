import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFieldService } from '../../core/services/util/formly-field.service';
import { LocalStorageService } from '../../core/services/util/local-storage.service';
import { AdaptedPayout } from '../../shared/models/adapted-payout.interface';
import { Finish } from '../../shared/models/finish.interface';
import { NotificationService } from '../../core/services/notification.service';
import { Player } from '../../shared/models/player.interface';

@Component({
    selector: 'app-modify-payout',
    templateUrl: './modify-payout.component.html',
    styleUrls: ['./modify-payout.component.scss']
})
export class ModifyPayoutComponent implements OnInit {

    private dialogRef: MatDialogRef<ModifyPayoutComponent> = inject(MatDialogRef<ModifyPayoutComponent>);
    data: {
        pricepool: number,
        payouts: number[],
        finishes: Finish[],
        players: Player[],
        tId: number
    } = inject(MAT_DIALOG_DATA);

    form = new FormGroup({});
    options: FormlyFormOptions = {};
    fields: FormlyFieldConfig[];
    model: { [key: string]: number } = {};

    toDistribute: number = 0;
    total: number = 0;
    keys: number[];

    playersLeft: number;

    private formlyFieldService: FormlyFieldService = inject(FormlyFieldService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private notificationService: NotificationService = inject(NotificationService);

    ngOnInit(): void {
        this.fields = [];
        this.keys = [];
        this.total = this.data.payouts.reduce((acc, curr) => acc + curr, 0);
        this.toDistribute = this.data.payouts.reduce((acc, curr) => acc + curr, 0) - this.data.pricepool;
        this.playersLeft = this.data.players.length - this.data.finishes.length;

        this.data.payouts.forEach(
            (payout: number, index: number) => {
                this.keys.push(index);
                this.model[index] = payout;

                this.fields.push(
                    this.formlyFieldService.getDefaultNumberField(
                        index.toString(),
                        (index + 1).toString(),
                        true,
                        this.data.finishes.map(f => +f.rank).includes((index + 1))
                    )
                );
            });
    }

    addPayoutField(): void {
        this.model[this.fields.length] = 0;
        this.keys.push(this.fields.length);

        this.fields = [
            ...this.fields,
            this.formlyFieldService.getDefaultNumberField(
                this.fields.length.toString(),
                (this.fields.length + 1).toString(),
                true,
                this.data.finishes.map(f => +f.rank).includes((this.fields.length + 1))
            )
        ];
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

        if (!this.isAdaptedPayoutSameLikeInitial(adaptedPayoutObject)) {
            this.localStorageService.storeAdaptedPayout(adaptedPayoutObject);
            this.notificationService.success('Payouts modified');
        }

        this.dialogRef.close();
    }

    private isAdaptedPayoutSameLikeInitial(adaptedPayoutObject: AdaptedPayout): boolean {
        let isSame = true;

        adaptedPayoutObject.payouts.forEach(
            (payout, index) => {
                if (payout !== this.data.payouts[index]) {
                    isSame = false;
                }
            }
        );

        return isSame;
    }
}
