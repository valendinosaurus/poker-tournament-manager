import {
    Component,
    computed,
    DestroyRef,
    EventEmitter,
    HostListener,
    inject,
    OnInit,
    Output,
    Signal,
    WritableSignal
} from '@angular/core';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddRebuyComponent } from '../../../../../dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../../dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from '../../../../../dialogs/add-finish/add-finish.component';
import { MatDialog } from '@angular/material/dialog';
import { RankingService } from '../../../../../core/services/util/ranking.service';
import { LocalStorageService } from '../../../../../core/services/util/local-storage.service';
import { MenuDialogComponent } from './menu-dialog/menu-dialog.component';
import { TableDrawDialogComponent } from '../../../../../dialogs/table-draw/table-draw-dialog.component';
import { AsyncPipe, DecimalPipe, DOCUMENT, NgForOf, NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { SeriesMetadata } from '../../../../../shared/models/series.interface';
import { DEFAULT_DIALOG_POSITION, TIMER_DIALOG_PANEL_CLASS } from '../../../../../core/const/app.const';
import {
    AnimationBubbleBoyComponent
} from '../../../../../animation/animation-bubble-boy/animation-bubble-boy.component';
import { AnimationSeatOpenComponent } from '../../../../../animation/animation-seat-open/animation-seat-open.component';
import { AnimationWinnerComponent } from '../../../../../animation/animation-winner/animation-winner.component';
import { TimerStateService } from '../../../../services/timer-state.service';
import { TableDrawService } from '../../../../../core/services/table-draw.service';

declare var anime: any;

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        MatButtonModule,
        MatTooltipModule,
        DecimalPipe,
        NgForOf,
        NgStyle,
        NgTemplateOutlet,
        AnimationBubbleBoyComponent,
        AnimationSeatOpenComponent,
        AnimationWinnerComponent,
        AsyncPipe
    ]
})
export class ButtonsComponent implements OnInit {

    tournament: WritableSignal<Tournament>;
    metadata: WritableSignal<SeriesMetadata | undefined>;
    isProOrAdmin: Signal<boolean>;
    started: WritableSignal<Date | undefined>;
    isTournamentFinished: Signal<boolean>;
    isRebuyPhaseFinished: Signal<boolean>;
    canStartTournament: Signal<boolean>;
    isRunning: WritableSignal<boolean>;
    isTournamentLocked: Signal<boolean>;

    canShowInfoPanel: Signal<boolean>;
    isFullScreen: WritableSignal<boolean>;

    isAnimatingSeatOpen$ = new BehaviorSubject(false);
    isAnimatingBubbleBoy$ = new BehaviorSubject(false);
    winnerTrigger$ = new ReplaySubject<number>();

    playerHasToBeMoved: Signal<boolean>;
    tableHasToBeEliminated: Signal<boolean>;
    // TODO singals
    isAddPlayerBlocked = false;
    lastSeatOpenName = 'TEST NAME';
    winnerName = 'WINNER';
    winnerPrice = 0;
    lastPrice = 0;
    lastRank = 0;
    lastIsBubble = false;
    elem: HTMLElement;
    menuVisible = false;
    isAdaptedPayoutSumCorrect = true;

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private rankingService: RankingService = inject(RankingService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private document: Document = inject(DOCUMENT);
    private state: TimerStateService = inject(TimerStateService);
    private tableDrawService: TableDrawService = inject(TableDrawService);

    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullScreenModes(_event: Event) {
        this.chkScreenMode();
    }

    ngOnInit(): void {
        this.tournament = this.state.tournament;
        this.metadata = this.state.metadata;
        this.started = this.state.started;
        this.isTournamentFinished = this.state.isTournamentFinished;
        this.isProOrAdmin = this.state.isProOrAdmin;
        this.isRebuyPhaseFinished = this.state.isRebuyPhaseFinished;
        this.isRunning = this.state.isRunning;
        this.isTournamentLocked = this.state.isTournamentLocked;
        this.isFullScreen = this.state.isFullScreen;
        this.elem = this.document.documentElement;

        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.tournament().id);

        if (adaptedPayouts) {
            const adaptedSum = adaptedPayouts.reduce((p, c) => p + c, 0);
            this.isAdaptedPayoutSumCorrect = this.state.totalPricePool() === adaptedSum;
        } else {
            this.isAdaptedPayoutSumCorrect = true;
        }

        const numberOfPaidPlaces = adaptedPayouts
            ? adaptedPayouts.length
            : this.rankingService.getPayoutById(this.tournament().payout).length;

        const playersLeft = this.state.players().length - this.state.finishes().length;

        this.isAddPlayerBlocked = this.state.players().length >= numberOfPaidPlaces && playersLeft < numberOfPaidPlaces;

        this.canStartTournament = this.state.canStartTournament;
        this.playerHasToBeMoved = this.tableDrawService.playerHasToBeMoved;
        this.tableHasToBeEliminated = this.tableDrawService.tableHasToBeEliminated;

        this.canShowInfoPanel = computed(() =>
            (this.isAddPlayerBlocked && !this.isTournamentFinished())
            || (this.tournament().withRebuy && this.isRebuyPhaseFinished() && !this.isTournamentFinished())
            || !this.canStartTournament()
            || this.isTournamentFinished()
            || (this.canStartTournament() && !this.started())
            || this.playerHasToBeMoved()
            || this.tableHasToBeEliminated()
        );
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    openDrawDialog(): void {
        const dialogRef = this.dialog.open(TableDrawDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            id: 'draw'
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((e) => {
                if (e) {
                    this.lastSeatOpenName = e.name;
                    this.lastPrice = e.price;
                    this.lastIsBubble = e.isBubble;
                    this.winnerPrice = e.winnerPrice;
                    this.winnerName = e.winnerName;
                    this.lastRank = e.rank;

                    if (this.lastIsBubble) {
                        this.isAnimatingBubbleBoy$.next(true);

                        setTimeout(() => {
                            this.isAnimatingBubbleBoy$.next(false);
                        }, 6000);
                    } else {
                        this.isAnimatingSeatOpen$.next(true);

                        setTimeout(() => {
                            this.isAnimatingSeatOpen$.next(false);
                        }, 6000);
                    }

                    if (e.rank === 2) {
                        setTimeout(
                            () => this.winnerTrigger$.next(Math.random()),
                            6000
                        );
                    }
                }
            })
        ).subscribe();
    }

    chkScreenMode() {
        this.state.isFullScreen.set(!!this.document.fullscreenElement);
    }

    fullScreen(): void {
        if (this.elem.requestFullscreen) {
            this.elem.requestFullscreen();
        } else if ((this.elem as any).mozRequestFullScreen) {
            (this.elem as any).mozRequestFullScreen();
        } else if ((this.elem as any).webkitRequestFullscreen) {
            (this.elem as any).webkitRequestFullscreen();
        } else if ((this.elem as any).msRequestFullscreen) {
            (this.elem as any).msRequestFullscreen();
        }
    }

    cancelFullscreen(): void {
        if (this.document.exitFullscreen) {
            this.document.exitFullscreen();
        } else if ((this.document as any).mozCancelFullScreen) {
            (this.document as any).mozCancelFullScreen();
        } else if ((this.document as any).webkitExitFullscreen) {
            (this.document as any).webkitExitFullscreen();
        } else if ((this.document as any).msExitFullscreen) {
            (this.document as any).msExitFullscreen();
        }
    }

    openMenu(): void {
        const dialogRef = this.dialog.open(
            MenuDialogComponent, {
                data: {
                    isAddPlayerBlocked: this.isAddPlayerBlocked // TODO
                },
                panelClass: 'menu-dialog',
                ...DEFAULT_DIALOG_POSITION
            }
        );

        dialogRef.componentInstance.addMinute = this.addMinute;
        dialogRef.componentInstance.nextLevel = this.nextLevel;
        dialogRef.componentInstance.prevLevel = this.prevLevel;
        dialogRef.componentInstance.previousLevel = this.previousLevel;
    }

    toggleRunning(): void {
        if (this.state.isRunning()) {
            this.state.pauseTimer();
        } else {
            this.state.startTimer();
        }
    }

}
