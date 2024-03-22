import {
    Component,
    DestroyRef,
    EventEmitter,
    HostListener,
    inject,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { ActionEventApiService } from '../../../../../core/services/api/action-event-api.service';
import { ServerResponse } from '../../../../../shared/models/server-response';
import { tap } from 'rxjs/operators';
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
import { TableDraw } from '../../../../../shared/models/table-draw.interface';
import { TableDrawDialogComponent } from '../../../../../dialogs/table-draw/table-draw-dialog.component';
import { DOCUMENT } from '@angular/common';

declare var anime: any;

@Component({
    selector: 'app-buttons',
    templateUrl: './buttons.component.html',
    styleUrls: ['./buttons.component.scss']
})
export class ButtonsComponent implements OnInit, OnChanges {

    @Input() clientId: number;
    @Input() running: boolean;
    @Input() sub: string | undefined;
    @Input() tournament: Tournament;
    @Input() seriesMetadata: SeriesMetadata | null;
    @Input() isSimpleTournament: boolean;
    @Input() isRebuyPhaseFinished: boolean;
    @Input() isTournamentFinished: boolean;

    isAddPlayerBlocked = false;
    isAnimating = false;
    lastSeatOpenName = 'TEST NAME';
    canStartTournament = false;
    playerHasToBeMoved = false;
    tableHasToBeEliminated = false;
    isFullscreen = false;
    elem: HTMLElement;

    menuVisible = false;

    isRebuyPhaseFinished$ = new ReplaySubject<boolean>();

    isAdaptedPayoutSumCorrect = true;

    dialogPosition = {
        position: {
            top: '40px'
        },
        maxHeight: '90vh'
    };

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private rankingService: RankingService = inject(RankingService);
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private tournamentService: TournamentService = inject(TournamentService);
    private document: Document = inject(DOCUMENT);

    @Output() start = new EventEmitter<void>();
    @Output() pause = new EventEmitter<void>();
    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();
    @Output() toggleAutoSlide = new EventEmitter<boolean>();
    @Output() toggleShowCondensedBlinds = new EventEmitter<boolean>();
    @Output() localRefresh = new EventEmitter<void>();

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullScreenModes(_event: Event) {
        this.chkScreenMode();
    }

    ngOnInit(): void {
        this.elem = this.document.documentElement;
    }

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

        const numberOfPaidPlaces = adaptedPayouts
            ? adaptedPayouts.length
            : this.rankingService.getPayoutById(this.tournament.payout).length;

        const playersLeft = this.tournament.players.length - this.tournament.finishes.length;

        this.isAddPlayerBlocked = this.tournament.players.length >= numberOfPaidPlaces && playersLeft < numberOfPaidPlaces;

        this.canStartTournament = this.tournamentService.getCanStartTournament(this.tournament);

        const draw: TableDraw = this.localStorageService.getTableDraw(this.tournament.id);

        if (draw) {
            this.playerHasToBeMoved = this.getPlayerHasToBeMoved(draw);
            this.tableHasToBeEliminated = draw.tableHasToBeEliminated;
        }

        if (changes['isRebuyPhaseFinished']?.currentValue !== undefined) {
            this.isRebuyPhaseFinished$.next(this.isRebuyPhaseFinished);
        }
    }

    private getPlayerHasToBeMoved(tableDraw: TableDraw): boolean {

        const numberOfRemainingPlayersPerTable: number[] = [];

        tableDraw.tables.forEach(
            t => {
                numberOfRemainingPlayersPerTable.push(t.filter(e => !e.eliminated && !e.placeholder).length
                );
            });

        const min = Math.min(...numberOfRemainingPlayersPerTable);
        const max = Math.max(...numberOfRemainingPlayersPerTable);

        return max - min > 1;
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...this.dialogPosition,
            data: {
                tournamentId: this.tournament.id,
                tournamentName: this.tournament.name,
                clientId: this.clientId,
                sub: this.sub
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
                sub: this.sub
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    openDrawDialog(): void {
        const dialogRef = this.dialog.open(TableDrawDialogComponent, {
            ...this.dialogPosition,
            data: {
                tournament: this.tournament,
            },
            id: 'draw'
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
                sub: this.sub
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

    chkScreenMode() {
        if (this.document.fullscreenElement) {
            this.isFullscreen = true;
        } else {
            this.isFullscreen = false;
        }
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
                    isRebuyPhaseFinished$: this.isRebuyPhaseFinished$,
                    tournament: this.tournament,
                    seriesMetadata: this.seriesMetadata,
                    clientId: this.clientId,
                    sub: this.sub,
                    running: this.running,
                    isAddPlayerBlocked: this.isAddPlayerBlocked
                },
                ...this.dialogPosition
            }
        );

        dialogRef.componentInstance.start = this.start;
        dialogRef.componentInstance.pause = this.pause;
        dialogRef.componentInstance.addMinute = this.addMinute;
        dialogRef.componentInstance.nextLevel = this.nextLevel;
        dialogRef.componentInstance.prevLevel = this.prevLevel;
        dialogRef.componentInstance.previousLevel = this.previousLevel;
        dialogRef.componentInstance.toggleAutoSlide = this.toggleAutoSlide;
        dialogRef.componentInstance.toggleShowCondensedBlinds = this.toggleShowCondensedBlinds;
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

    toggleRunning(): void {
        if (this.running) {
            this.pause.emit();
        } else {
            this.start.emit();
        }
    }

}
