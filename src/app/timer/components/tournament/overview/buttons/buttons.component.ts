import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { Observable } from 'rxjs';
import { EventApiService } from '../../../../../core/services/api/event-api.service';
import { ServerResponse } from '../../../../../shared/models/server-response';
import { take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddRebuyComponent } from '../../../../../dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../../dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from '../../../../../dialogs/add-finish/add-finish.component';
import { MatDialog } from '@angular/material/dialog';
import { TournamentService } from '../../../../../core/services/util/tournament.service';
import { SeriesMetadata } from '../../../../../shared/models/series-metadata.interface';
import { RankingService } from '../../../../../core/services/util/ranking.service';
import { LocalStorageService } from '../../../../../core/services/util/local-storage.service';
import { MenuDialogComponent } from './menu-dialog/menu-dialog.component';

declare var anime: any;

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnChanges {

    @Input() clientId: number;
    @Input() running: boolean;
    @Input() sub: string | undefined;
    @Input() tournament: Tournament;
    @Input() seriesMetadata: SeriesMetadata | null;
    @Input() isSimpleTournament: boolean;
    @Input() isRebuyPhaseFinished: boolean;

    isOverlayOpen = false;
    isAnimating = false;
    lastSeatOpenName = 'TEST NAME';

    dialogPosition = {
        position: {
            top: '40px'
        }
    };

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private rankingService: RankingService = inject(RankingService);
    private eventApiService: EventApiService = inject(EventApiService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private tournamentService: TournamentService = inject(TournamentService);

    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();
    @Output() toggleAutoSlide = new EventEmitter<boolean>();
    @Output() localRefresh = new EventEmitter<void>();

    isAdaptedPayoutSumCorrect = true;

    ngOnChanges(changes: SimpleChanges): void {
        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.tournament.id);

        if (adaptedPayouts) {
            const {totalPricePool, deduction} = this.rankingService.getTotalPricePool(
                this.tournament.entries,
                this.tournament.buyInAmount,
                this.tournament.rebuyAmount,
                this.tournament.addonAmount,
                this.tournament.initialPricePool,
                this.seriesMetadata?.percentage,
                this.seriesMetadata?.maxAmountPerTournament
            );

            const adaptedSum = adaptedPayouts.reduce((p, c) => p + c, 0);
            this.isAdaptedPayoutSumCorrect = totalPricePool === adaptedSum;
        } else {
            this.isAdaptedPayoutSumCorrect = true;
        }

    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                tournamentName: this.tournament.name,
                clientId: this.clientId,
                eligibleForRebuy: this.tournamentService.getPlayersEligibleForRebuy(this.tournament),
                conductedRebuys: this.tournamentService.getConductedRebuys(this.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                tournamentName: this.tournament.name,
                clientId: this.clientId,
                eligibleForAddon: this.tournamentService.getPlayersEligibleForAddon(this.tournament),
                conductedAddons: this.tournamentService.getConductedAddons(this.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.tournament,
                metadata: this.seriesMetadata,
                clientId: this.clientId,
                eligibleForSeatOpen: this.tournamentService.getPlayersEligibleForSeatOpen(this.tournament),
                conductedSeatOpens: this.tournamentService.getConductedSeatOpens(this.tournament)
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((e) => {
                if (e) {
                    this.lastSeatOpenName = e.name;
                    this.doConfetti();
                }
                ;
            })
        ).subscribe();
    }

    notify(): void {
        this.getReFetchEvent$().pipe(
            take(1)
        ).subscribe();
    }

    getReFetchEvent$(): Observable<ServerResponse | null> {
        return this.eventApiService.post$({
            id: null,
            tId: this.tournament.id,
            clientId: this.clientId
        });
    }

    openMenu(): void {
        const dialogRef = this.dialog.open(
            MenuDialogComponent, {
                data: {
                    isSimpleTournament: this.isSimpleTournament,
                    isRebuyPhaseFinished: this.isRebuyPhaseFinished,
                    tournament: this.tournament,
                    seriesMetadata: this.seriesMetadata,
                    clientId: this.clientId,
                    sub: this.sub,
                    running: this.running,
                },
                height: '80%'
            }
        );

        dialogRef.componentInstance.start = this.start;
        dialogRef.componentInstance.pause = this.pause;
        dialogRef.componentInstance.addMinute = this.addMinute;
        dialogRef.componentInstance.nextLevel = this.nextLevel;
        dialogRef.componentInstance.prevLevel = this.prevLevel;
        dialogRef.componentInstance.previousLevel = this.previousLevel;
        dialogRef.componentInstance.toggleAutoSlide = this.toggleAutoSlide;
        dialogRef.componentInstance.localRefresh = this.localRefresh;
    }

    hidden = false;

    doConfetti(): void {
        this.isAnimating = true;

        setTimeout(() => this.isAnimating = false, 6000);

        anime.timeline({loop: false})
            .add({
                targets: '.seat-open-animation .word',
                scale: [14, 1],
                opacity: [0, 1],
                easing: 'easeInOutQuad',
                duration: 400,
                delay: (el: any, i: number) => 500 * i
            }).add({
            targets: '.seat-open-animation',
            opacity: 0,
            duration: 1000,
            easing: 'easeInOutQuad',
            delay: 1000
        });

        setTimeout(
            () => {
                this.shoot();
            },
            2000
        );
    }

    shoot() {
        try {
            this.confetti({
                angle: 90,
                spread: 360,
                particleCount: this.random(4000, 5000),
                origin: {
                    y: 0.4
                }
            });
        } catch (e) {
            // noop, confettijs may not be loaded yet
        }
    }

    random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    confetti(args: any) {
        // @ts-ignore
        return window['confetti'].apply(this, arguments);
    }

}
