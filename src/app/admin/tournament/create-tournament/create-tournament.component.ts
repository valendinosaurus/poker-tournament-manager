import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TournamentApiService } from '../../../shared/services/api/tournament-api.service';
import { RankingService } from '../../../shared/services/util/ranking.service';
import { catchError, map, take, tap } from 'rxjs/operators';
import { LocationApiService } from '../../../shared/services/api/location-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { CreateTournamentModel, Tournament, TournamentModel } from '../../../shared/interfaces/tournament.interface';
import { TriggerService } from '../../../shared/services/util/trigger.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Observable, of } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';
import { RouterLink } from '@angular/router';
import { BaseAddDialogComponent } from '../../../shared/components/base-add-dialog/base-add-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-create-tournament',
    templateUrl: './create-tournament.component.html',
    standalone: true,
    imports: [
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatStepperModule,
        MatDatepickerModule,
        RouterLink,
        MatFormFieldModule,
        MatInputModule,
        AsyncPipe,
        MatOptionModule,
        MatSelectModule,
        MatCheckboxModule
    ],
})
export class CreateTournamentComponent extends BaseAddDialogComponent<CreateTournamentComponent, CreateTournamentModel> implements OnInit {

    data: {
        tournament: Tournament | null;
    } = inject(MAT_DIALOG_DATA);

    allPayouts: { label: string, value: number }[] = [];
    formulas$: Observable<{ label: string, value: number | null }[]>;
    locations$: Observable<{ label: string, value: number }[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private rankingService: RankingService = inject(RankingService);
    private locationService: LocationApiService = inject(LocationApiService);
    private destroyRef = inject(DestroyRef);
    private triggerService: TriggerService = inject(TriggerService);
    private notificationService: NotificationService = inject(NotificationService);

    ngOnInit(): void {
        this.initModel();

        this.allPayouts = this.rankingService.getAllPayoutsForSelect();
        this.formulas$ = this.rankingService.getFormulasForSelect$();

        this.locations$ = this.locationService.getAll$().pipe(
            takeUntilDestroyed(this.destroyRef),
            map((locations) =>
                locations.map(l => ({label: l.name, value: l.id}))
            ),
            tap((locations) => {
                this.model.location.set(locations[0].value);
            })
        );

    }

    private initModel(): void {
        this.model = {
            id: signal(this.data?.tournament?.id ?? undefined),
            name: signal(this.data?.tournament?.name ?? ''),
            date: signal(this.data?.tournament?.date
                ? this.getDateString(new Date(this.data.tournament.date))
                : this.getDateString(new Date())
            ),
            //date: signal(this.data?.tournament?.date ? new Date(this.data.tournament.date).toISOString() : new Date().toISOString()),
            maxPlayers: signal(this.data?.tournament?.maxPlayers ?? 0),
            startStack: signal(this.data?.tournament?.startStack ?? 0),
            initialPricePool: signal(this.data?.tournament?.initialPricePool ?? 0),
            buyInAmount: signal(this.data?.tournament?.buyInAmount ?? 0),
            withReEntry: signal(this.data?.tournament?.withReEntry ?? false),
            noOfReEntries: signal(this.data?.tournament?.noOfReEntries ?? 0),
            withRebuy: signal(this.data?.tournament?.withRebuy ?? false),
            noOfRebuys: signal(this.data?.tournament?.noOfRebuys ?? 0),
            rebuyAmount: signal(this.data?.tournament?.rebuyAmount ?? 0),
            rebuyStack: signal(this.data?.tournament?.rebuyStack ?? 0),
            withAddon: signal(this.data?.tournament?.withAddon ?? false),
            addonAmount: signal(this.data?.tournament?.addonAmount ?? 0),
            addonStack: signal(this.data?.tournament?.addonStack ?? 0),
            withBounty: signal(this.data?.tournament?.withBounty ?? false),
            bountyAmount: signal(this.data?.tournament?.bountyAmount ?? 0),
            payout: signal(this.data?.tournament?.payout ?? 0),
            rankFormula: signal(this.data?.tournament?.rankFormula?.id ?? null),
            location: signal(this.data?.tournament?.location ?? -1),
            temp: signal(this.data?.tournament?.temp ?? false),
            password: signal(this.data?.tournament?.password ?? ''),
            isValid: computed(() =>
                this.model.name().length > 0
                && this.model.date().length > 0
                && this.model.payout() >= 0
                && this.model.location() >= 0
            )
        };
    }

    private getDateString(date: Date): string {
        console.log(date);
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();

        return `${date.getFullYear()}-${month.length === 1 ? '0' : ''}${month}-${day.length === 1 ? '0' : ''}${day}`;
    }

    onSubmit(): void {
        this.isLoadingAdd = true;

        const model: TournamentModel = {
            id: this.model.id(),
            name: this.model.name(),
            date: new Date(this.model.date()).toISOString(),
            maxPlayers: this.model.maxPlayers(),
            startStack: this.model.startStack(),
            initialPricePool: this.model.initialPricePool(),
            buyInAmount: this.model.buyInAmount(),
            noOfRebuys: this.model.noOfRebuys(),
            rebuyAmount: this.model.rebuyAmount(),
            rebuyStack: this.model.rebuyStack(),
            noOfReEntries: this.model.noOfReEntries(),
            addonStack: this.model.addonStack(),
            addonAmount: this.model.addonAmount(),
            withRebuy: this.model.withRebuy(),
            withAddon: this.model.withAddon(),
            withReEntry: this.model.withReEntry(),
            withBounty: this.model.withBounty(),
            bountyAmount: this.model.bountyAmount(),
            payout: this.model.payout(),
            rankFormula: this.model.rankFormula(),
            location: this.model.location(),
            temp: this.model.temp(),
            password: this.model.password(),
            locked: false,
            adaptedPayout: undefined,
            settings: {
                started: undefined,
                autoSlide: true,
                timeLeft: 0,
                levelIndex: 0,
                id: -1,
                showCondensedBlinds: false
            }
        };

        if (this.data?.tournament) {
            this.tournamentApiService.put$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerTournaments()),
                tap(() => this.dialogRef.close(true)),
                catchError(() => {
                    this.notificationService.error('ERROR EDITING TOURNAMENT');
                    return of(null);
                }),
            ).subscribe();
        } else {
            this.tournamentApiService.post$(model).pipe(
                take(1),
                tap(() => this.triggerService.triggerTournaments()),
                tap(() => this.dialogRef.close(true)),
                catchError(() => {
                    this.notificationService.error('ERROR CREATING TOURNAMENT');
                    return of(null);
                })
            ).subscribe();
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
