import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AdaptedPayout } from '../../shared/interfaces/util/adapted-payout.interface';
import { Finish } from '../../shared/interfaces/finish.interface';
import { NotificationService } from '../../shared/services/notification.service';
import { Player } from '../../shared/interfaces/player.interface';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TournamentApiService } from '../../shared/services/api/tournament-api.service';
import { BaseAddDialogComponent } from '../../shared/components/base-add-dialog/base-add-dialog.component';
import { ModifyPayoutModel } from './modify-payout-model.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NumberOfKeysPipe } from '../../shared/pipes/number-of-keys.pipe';
import { switchMap, take, tap } from 'rxjs/operators';

@Component({
    selector: 'app-modify-payout',
    templateUrl: './modify-payout.component.html',
    styleUrls: ['./modify-payout.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        DecimalPipe,
        MatFormFieldModule,
        MatInputModule,
        KeyValuePipe,
        NumberOfKeysPipe
    ]
})
export class ModifyPayoutComponent extends BaseAddDialogComponent<ModifyPayoutComponent, ModifyPayoutModel> implements OnInit {

    data: {
        pricepool: number,
        payouts: number[],
        finishes: Finish[],
        players: Player[],
        tId: number
    } = inject(MAT_DIALOG_DATA);

    toDistribute: number = 0;
    total: number = 0;
    keys: number[] = [];
    playersLeft: number;

    private notificationService: NotificationService = inject(NotificationService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);

    ngOnInit(): void {
        this.model = {};

        this.total = this.data.payouts.reduce((acc, curr) => acc + curr, 0);
        this.toDistribute = this.data.payouts.reduce((acc, curr) => acc + curr, 0) - this.data.pricepool;
        this.playersLeft = this.data.players.length - this.data.finishes.length;

        console.log('pay', this.data.payouts);

        this.data.payouts.forEach(
            (payout: number, index: number) => {
                this.keys.push(index);
                this.model[index] = {
                    payout: payout,
                    isDisabled: this.data.finishes.map(f => +f.rank).includes(index + 1)
                };
            });
    }

    addPayoutField(): void {
        const newIndex: number = Object.keys(this.model).length;
        this.model[newIndex] = {
            payout: 0,
            isDisabled: false
        };

        this.keys.push(newIndex);
    }

    modelChange(key: string, amount: number): void {
        console.log('model change', key, amount);
        this.model[key].payout = amount;
        this.total = 0;

        this.keys.forEach(k => {
            console.log('adding', this.model[k].payout);
            this.total += +this.model[k].payout;
        });

        console.log(this.total);
        this.toDistribute = this.data.pricepool - this.total;
    }

    onSubmit(): void {
        const model = this.model;

        console.log(model);

        const payouts: number[] = [];
        const keys = Object.keys(model);

        keys.forEach((key) => payouts.push(+model[key].payout));

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
