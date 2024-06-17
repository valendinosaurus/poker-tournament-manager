import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { FormlyFieldService } from '../../shared/services/util/formly-field.service';
import { LocalStorageService } from '../../shared/services/util/local-storage.service';
import { AdaptedPayout } from '../../shared/interfaces/util/adapted-payout.interface';
import { Finish } from '../../shared/interfaces/finish.interface';
import { NotificationService } from '../../shared/services/notification.service';
import { Player } from '../../shared/interfaces/player.interface';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { switchMap, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-modify-payout',
    templateUrl: './modify-payout.component.html',
    styleUrls: ['./modify-payout.component.scss'],
    standalone: true,
    imports: [FormsModule, FormlyModule, MatButtonModule, DecimalPipe]
})
export class ModifyPayoutComponent implements OnInit {

    private dialogRef: MatDialogRef<ModifyPayoutComponent> = inject(MatDialogRef<ModifyPayoutComponent>);
    // TODO remove
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
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

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
            this.tournamentApiService.deleteAdaptedPayout$(this.data.tId).pipe(
                take(1),
                switchMap(() => this.tournamentApiService.addAdaptedPayout$(
                    adaptedPayoutObject.tournamentId,
                    adaptedPayoutObject.payouts
                )),
                tap(() => {
                    this.notificationService.success('Payouts modified');
                    this.dialogRef.close();
                })
            ).subscribe();

//            this.localStorageService.storeAdaptedPayout(adaptedPayoutObject);

        }

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
