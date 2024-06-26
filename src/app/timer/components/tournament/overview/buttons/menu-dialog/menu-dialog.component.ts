import {
    Component,
    computed,
    DestroyRef,
    EventEmitter,
    HostListener,
    inject,
    OnInit,
    Output,
    signal,
    Signal,
    WritableSignal
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddEntryComponent } from '../../../../../../dialogs/add-entry/add-entry.component';
import { FormsModule } from '@angular/forms';
import {
    LocalTournamentSettings,
    LocalTournamentSettingsModel
} from '../../../../../../shared/interfaces/local-tournament-settings.interface';
import { defer, iif, Observable, of } from 'rxjs';
import { MakeDealComponent } from '../../../../../../dialogs/make-deal/make-deal.component';
import { AddRebuyComponent } from '../../../../../../dialogs/add-rebuy/add-rebuy.component';
import { AddAddonComponent } from '../../../../../../dialogs/add-addon/add-addon.component';
import { AddFinishComponent } from '../../../../../../dialogs/add-finish/add-finish.component';
import { RankingService } from '../../../../../../shared/services/util/ranking.service';
import { AddPlayerComponent } from '../../../../../../dialogs/add-player/add-player.component';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { TournamentApiService } from '../../../../../../shared/services/api/tournament-api.service';
import { FetchService } from '../../../../../../shared/services/fetch.service';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { TableDrawDialogComponent } from '../../../../../../dialogs/table-draw/table-draw-dialog.component';
import { DEFAULT_DIALOG_POSITION, TIMER_DIALOG_PANEL_CLASS } from '../../../../../../shared/const/app.const';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthUtilService } from '../../../../../../shared/services/auth-util.service';
import { TournamentService } from '../../../../../../shared/services/util/tournament.service';
import { TimerStateService } from '../../../../../services/timer-state.service';
import { Tournament } from '../../../../../../shared/interfaces/tournament.interface';
import { SeriesMetadata } from '../../../../../../shared/interfaces/series.interface';
import { EntryType } from '../../../../../../shared/enums/entry-type.enum';
import { BaseAddDialogComponent } from '../../../../../../shared/components/base-add-dialog/base-add-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-menu-dialog',
    templateUrl: './menu-dialog.component.html',
    styleUrls: ['./menu-dialog.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        RouterLink,
        FormsModule,
        AsyncPipe,
        MatFormFieldModule,
        MatInputModule,
        MatOptionModule,
        MatSelectModule
    ]
})
export class MenuDialogComponent extends BaseAddDialogComponent<MenuDialogComponent, LocalTournamentSettingsModel> implements OnInit {

    tournament: WritableSignal<Tournament>;
    metadata: WritableSignal<SeriesMetadata | undefined>;
    isProOrAdmin: WritableSignal<boolean>;
    isRebuyPhaseFinished: Signal<boolean>;
    isTournamentFinished: Signal<boolean>;
    isTournamentLocked: Signal<boolean>;
    withRebuy: Signal<boolean>;
    withAddon: Signal<boolean>;
    withReEntry: Signal<boolean>;
    autoSlide: Signal<boolean>;
    showCondensedBlinds: Signal<boolean>;
    isRunning: WritableSignal<boolean>;
    isITM: Signal<boolean>;

    areAllPlayersEntered = computed(() =>
        this.tournament().players.length === this.tournament().entries.filter(e => e.type === EntryType.ENTRY).length
        && this.tournament().players.length > 0
    );

    isFullScreen: WritableSignal<boolean>;
    isBigCursor: WritableSignal<boolean>;
    isPayoutAdapted = computed(() => this.tournament().adaptedPayout !== undefined);

    payoutDone = computed(() =>
        this.tournament().finishes.filter(f => +f.price > 0).length > 0
    );

    elem: HTMLElement;

    payoutsForSelect: { value: number, label: string }[] = [];

    data: {
        isAddPlayerBlocked: boolean,
    } = inject(MAT_DIALOG_DATA);

    payoutCache: number;

    private destroyRef: DestroyRef = inject(DestroyRef);
    private dialog: MatDialog = inject(MatDialog);
    private authUtilService: AuthUtilService = inject(AuthUtilService);
    private rankingService: RankingService = inject(RankingService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);
    private document: Document = inject(DOCUMENT);
    private tournamentService: TournamentService = inject(TournamentService);
    private state: TimerStateService = inject(TimerStateService);

    isAuthenticated$: Observable<boolean> = this.authUtilService.getIsAuthenticated$();

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    fullScreenModes(_event: Event) {
        this.chkScreenMode();
    }

    @Output() addMinute = new EventEmitter<void>();
    @Output() nextLevel = new EventEmitter<void>();
    @Output() prevLevel = new EventEmitter<void>();
    @Output() previousLevel = new EventEmitter<void>();

    ngOnInit(): void {
        this.tournament = this.state.tournament;
        this.isProOrAdmin = this.state.isProOrAdmin;
        this.isRebuyPhaseFinished = this.state.isRebuyPhaseFinished;
        this.withRebuy = this.state.withRebuy;
        this.withAddon = this.state.withAddon;
        this.withReEntry = this.state.withReEntry;
        this.autoSlide = this.state.autoSlide;
        this.showCondensedBlinds = this.state.showCondensedBlinds;
        this.isRunning = this.state.isRunning;
        this.isTournamentLocked = this.state.isTournamentLocked;
        this.isTournamentFinished = this.state.isTournamentFinished;
        this.isFullScreen = this.state.isFullScreen;
        this.isBigCursor = this.state.isBigCursor;
        this.isITM = this.state.isITM;

        this.elem = this.document.documentElement;
        this.initModel();
    }

    private initModel(): void {
        const payouts = this.rankingService.payouts.sort(
            (a, b) => a.prices.length - b.prices.length
        );

        const placesLeft = this.tournament().players.length - this.tournament().finishes.length;

        this.payoutsForSelect = payouts.map(p => ({
            label: p.prices.reduce((acc, curr) => `${acc} | ${curr}%`, ''),
            value: p.id,
            length: p.prices.length
        })).filter(
            e => e.length <= placesLeft
        ).map(e => ({
            value: e.value,
            label: `${e.length} places paid - ${e.label.slice(3)}`
        }));

        this.model = {
            id: signal(this.tournament().id),
            payout: signal(this.tournament().payout),
            name: signal(this.tournament().name),
            isValid: computed(() =>
                    this.model.name() !== ''
                    && this.model.payout() >= 0
                    && (
                        this.model.payout() !== this.tournament().payout
                        || this.model.name() !== this.tournament().name
                    )
            )
        };

        this.payoutCache = this.tournament().payout;
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
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

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                multi: false
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    addEntry(isReEntry: boolean): void {
        const dialogRef = this.dialog.open(AddEntryComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            data: {
                isReentry: isReEntry,
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    makeDeal(): void {
        const dialogRef = this.dialog.open(MakeDealComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

    drawTables(): void {
        const dialogRef = this.dialog.open(TableDrawDialogComponent, {
            ...DEFAULT_DIALOG_POSITION,
            ...TIMER_DIALOG_PANEL_CLASS,
            id: 'draw'
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
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

    onToggleAutoSlide(): void {
        this.tournamentApiService.putTournamentSettings$({
            ...this.state.settings(),
            autoSlide: !this.state.autoSlide()
        }).pipe(
            take(1),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    onToggleShowCondensedBlinds(): void {
        this.tournamentApiService.putTournamentSettings$({
            ...this.state.settings(),
            showCondensedBlinds: !this.state.showCondensedBlinds()
        }).pipe(
            take(1),
            tap(() => this.fetchService.trigger())
        ).subscribe();
    }

    onToggleIsBigCursor(): void {
        this.state.isBigCursor.set(!this.isBigCursor);

        if (this.isBigCursor()) {
            document.querySelector('body')?.classList.add('big-cursor');
        } else {
            document.querySelector('body')?.classList.remove('big-cursor');
        }
    }

    resetState(): void {
        this.tournamentApiService.deleteTournamentSettings$(this.tournament().id).pipe(
            take(1),
            tap(() => this.state.markForReset.set(true)),
            tap(() => this.fetchService.trigger()),
        ).subscribe();
    }

    applySettings(): void {
        this.isLoadingAdd = true;

        const model: LocalTournamentSettings = {
            id: this.tournament().id,
            payout: this.model.payout(),
            name: this.model.name()
        };

        this.tournamentApiService.putLocalTournamentSettings$(model).pipe(
            take(1),
            switchMap(() => iif(
                () => model.payout !== this.payoutCache,
                defer(() => this.tournamentApiService.deleteAdaptedPayout$(this.tournament().id)),
                of(null)
            )),
            tap(() => {
                this.fetchService.trigger();
                this.isLoadingAdd = false;
            }),
            this.tournamentService.postActionEvent$,
            tap(() => this.closeMenu()),
            catchError(() => {
                this.isLoadingAdd = false;
                return of(null);
            })
        ).subscribe();
    }

    closeMenu(): void {
        this.dialogRef.close();
    }

    onStart(): void {
        this.state.startTimer();
    }

    onPause(): void {
        this.state.pauseTimer();
    }
}
