import {
    Component,
    computed,
    DestroyRef,
    EventEmitter,
    HostListener,
    inject,
    OnInit,
    Output,
    Signal
} from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddRebuyComponent } from '../../../../../dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../../dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from '../../../../../dialogs/add-finish/add-finish.component';
import { MatDialog } from '@angular/material/dialog';
import { RankingService } from '../../../../../shared/services/util/ranking.service';
import { MenuDialogComponent } from './menu-dialog/menu-dialog.component';
import { TableDrawDialogComponent } from '../../../../../dialogs/table-draw/table-draw-dialog.component';
import { AsyncPipe, DecimalPipe, DOCUMENT, NgStyle, NgTemplateOutlet } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DEFAULT_DIALOG_POSITION, TIMER_DIALOG_PANEL_CLASS } from '../../../../../shared/const/app.const';
import {
    AnimationBubbleBoyComponent
} from '../../../../../animation/animation-bubble-boy/animation-bubble-boy.component';
import { AnimationSeatOpenComponent } from '../../../../../animation/animation-seat-open/animation-seat-open.component';
import { AnimationWinnerComponent } from '../../../../../animation/animation-winner/animation-winner.component';
import { TimerStateService } from '../../../../services/timer-state.service';
import { InfoPanelComponent } from '../../../../../shared/components/info-panel/info-panel.component';
import { TableDrawService } from '../../../../../table-draw/services/table-draw.service';
import { TableDrawAction } from '../../../../../table-draw/enums/table-draw-action.enum';

declare var anime: any;

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        MatTooltipModule,
        DecimalPipe,
        NgStyle,
        NgTemplateOutlet,
        AnimationBubbleBoyComponent,
        AnimationSeatOpenComponent,
        AnimationWinnerComponent,
        AsyncPipe,
        InfoPanelComponent
    ]
})
export class ButtonsComponent implements OnInit {

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private rankingService: RankingService = inject(RankingService);
    private document: Document = inject(DOCUMENT);
    private state: TimerStateService = inject(TimerStateService);
    private tableDrawService: TableDrawService = inject(TableDrawService);

    tournament = this.state.tournament;
    metadata = this.state.metadata;
    started = this.state.started;
    isTournamentFinished = this.state.isTournamentFinished;
    isProOrAdmin = this.state.isProOrAdmin;
    isRebuyPhaseFinished = this.state.isRebuyPhaseFinished;
    isRunning = this.state.isRunning;
    isTournamentLocked = this.state.isTournamentLocked;
    isFullScreen = this.state.isFullScreen;
    isITM = this.state.isITM;
    elem = this.document.documentElement;
    hasLevels = this.state.hasLevels;
    canStartTournament = this.state.canStartTournament;
    isAddPlayerBlocked = this.state.isAddPlayerBlocked;
    hasPlayersToSeatOpen = this.state.hasPlayersToSeatOpen;
    currentTableDrawAction = this.tableDrawService.currentAction;
    // playerHasToBeMoved = this.tableDrawService.playerHasToBeMoved;
    // tableHasToBeEliminated = this.tableDrawService.tableHasToBeEliminated;

    canShowInfoPanel: Signal<boolean>;

    isAnimatingSeatOpen$ = new BehaviorSubject(false);
    isAnimatingBubbleBoy$ = new BehaviorSubject(false);
    winnerTrigger$ = new ReplaySubject<number>();

    // TODO singals
    lastSeatOpenName = 'TEST NAME';
    winnerName = 'WINNER';
    winnerPrice = 0;
    lastPrice = 0;
    lastRank = 0;
    lastIsBubble = false;
    menuVisible = false;
    isAdaptedPayoutSumCorrect = true;

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
        const adaptedPayouts: number[] | undefined = this.tournament().adaptedPayout;

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

        this.state.isAddPlayerBlocked.set(this.state.players().length >= numberOfPaidPlaces && playersLeft < numberOfPaidPlaces);

        this.canShowInfoPanel = computed(() =>
            (this.isAddPlayerBlocked() && !this.isTournamentFinished())
            || (this.tournament().withRebuy && this.isRebuyPhaseFinished() && !this.isTournamentFinished())
            || !this.canStartTournament()
            || this.isTournamentFinished()
            || (this.canStartTournament() && !this.started())
            || this.currentTableDrawAction() === TableDrawAction.PLAYER_HAS_TO_BE_MOVED// this.playerHasToBeMoved()
            || this.currentTableDrawAction() === TableDrawAction.TABLE_CAN_BE_ELIMINATED//this.tableHasToBeEliminated()
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
                panelClass: 'menu-dialog',
                ...DEFAULT_DIALOG_POSITION,
                autoFocus: false
            }
        );

        dialogRef.componentInstance.addMinute = this.addMinute;
        dialogRef.componentInstance.nextLevel = this.nextLevel;
        dialogRef.componentInstance.prevLevel = this.prevLevel;
    }

    toggleRunning(): void {
        if (this.state.isRunning()) {
            this.state.pauseTimer();
        } else {
            this.state.startTimer();
        }
    }

}
