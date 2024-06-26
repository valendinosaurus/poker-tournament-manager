import {
    AfterViewInit,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    HostListener,
    inject,
    OnInit,
    Signal,
    signal,
    ViewChild,
    WritableSignal
} from '@angular/core';
import { interval } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { BlindLevel } from 'src/app/shared/interfaces/blind-level.interface';
import { CountdownComponent, CountdownConfig, CountdownEvent, CountdownStatus } from 'ngx-countdown';
import { Tournament } from '../../../../shared/interfaces/tournament.interface';
import KeenSlider, { KeenSliderInstance } from 'keen-slider';
import { MatDialog } from '@angular/material/dialog';
import { ChipsOverviewComponent } from './chips-overview/chips-overview.component';
import { PlayerOverviewComponent } from './player-overview/player-overview.component';
import { BuyinOverviewComponent } from './buyin-overview/buyin-overview.component';
import { PlayerDetailsComponent } from './player-details/player-details.component';
import { PayoutDetailsComponent } from './payout-details/payout-details.component';
import { BlindLevelOverviewComponent } from './blind-level-overview/blind-level-overview.component';
import { AddBlindsComponent } from '../../../../dialogs/add-blinds/add-blinds.component';
import { RankingComponent } from './ranking/ranking.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsComponent } from './buttons/buttons.component';
import { BlindLevelTextPipe } from '../../../../shared/pipes/blind-level-text.pipe';
import { TimePipe } from '../../../../shared/pipes/time.pipe';
import { LeaderboardInfoComponent } from './leaderboard/leaderboard-info.component';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { SeriesMetadata } from '../../../../shared/interfaces/series.interface';
import { DEFAULT_DIALOG_POSITION } from '../../../../shared/const/app.const';
import { TimerStateService } from '../../../services/timer-state.service';
import { TournamentApiService } from '../../../../shared/services/api/tournament-api.service';
import { FetchService } from '../../../../shared/services/fetch.service';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    standalone: true,
    imports: [
        BlindLevelOverviewComponent,
        PlayerDetailsComponent,
        NgIf,
        RankingComponent,
        LeaderboardInfoComponent,
        CountdownComponent,
        ButtonsComponent,
        PayoutDetailsComponent,
        PlayerOverviewComponent,
        BuyinOverviewComponent,
        ChipsOverviewComponent,
        TimePipe,
        AsyncPipe,
        DatePipe,
        BlindLevelTextPipe,
    ],
})
export class OverviewComponent implements OnInit, AfterViewInit {

    tournament: WritableSignal<Tournament>;
    metadata: WritableSignal<SeriesMetadata | undefined>;
    isFinished: Signal<boolean>;
    currentLevelIndex: WritableSignal<number>;
    isTournamentPartOfSeries: Signal<boolean> = signal(false);
    isRunning: WritableSignal<boolean>;
    levels: Signal<BlindLevel[]>;
    isRebuyPhaseFinished: Signal<boolean>;
    isProOrAdmin: WritableSignal<boolean>;
    isITM: Signal<boolean>;
    isWithRebuyOrAddon = computed(() => this.tournament().withRebuy || this.tournament().withAddon);

    slider: KeenSliderInstance;
    currentSlide: WritableSignal<number> = signal(0);

    currentLevelTimeLeft: WritableSignal<number> = signal(0);
    blindDuration: WritableSignal<number> = signal(0);
    blindDurationFixed: WritableSignal<number> = signal(0);

    today: Signal<number> = signal(Date.now());
    started: Signal<Date | undefined>;
    elapsed: Signal<number>;
    timeForRebuy: Signal<Date>;

    countdownConfig: WritableSignal<CountdownConfig>;

    firstDonePassed = false;
    blockNotifications = false;

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('bleepNext') bleepNext!: ElementRef;
    @ViewChild('cd') countdown!: CountdownComponent;
    @ViewChild('sliderRef') sliderRef: ElementRef<HTMLElement>;

    @ViewChild(BlindLevelOverviewComponent) blindCmp: BlindLevelOverviewComponent;
    @ViewChild(ButtonsComponent) buttonsCmp: ButtonsComponent;

    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private state: TimerStateService = inject(TimerStateService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private fetchService: FetchService = inject(FetchService);

    @HostListener('window:keyup.space', ['$event'])
    onKeydownSpaceHandler(event: Event) {
        event.preventDefault();

        if (this.state.isRunning()) {
            this.state.pauseTimer();
        } else {
            this.state.startTimer();
        }
    }

    @HostListener('window:keyup', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
        event.preventDefault();

        if (event.key === '+') {
            this.goToNextLevel();
        }

        if (event.key === '-') {
            this.goToPreviousLevel();
        }
    }

    _runningEffect = effect(() => {
        if (this.state.isRunning()) {
            this.countdown.resume();
        } else if (!this.state.isTournamentFinished()) {
            this.countdown.pause();
        }
    });

    ngOnInit(): void {
        this.tournament = this.state.tournament;
        this.metadata = this.state.metadata;
        this.isFinished = this.state.isTournamentFinished;
        this.currentLevelIndex = this.state.currentLevelIndex;
        this.isRunning = this.state.isRunning;
        this.levels = computed(() => this.tournament().structure);

        this.isTournamentPartOfSeries = computed(() =>
            this.metadata() !== undefined
            && this.metadata() !== null
            && this.metadata()?.rankFormula !== null
        );

        this.isRebuyPhaseFinished = this.state.isRebuyPhaseFinished;
        this.isProOrAdmin = this.state.isProOrAdmin;
        this.isITM = this.state.isITM;

        this.timeForRebuy = computed(() => {
            if (!this.tournament().withRebuy) {
                return new Date();
            }

            const levelOfRebuyFinishedIndex: number = this.levels().findIndex((l: BlindLevel) => l.isPause && l.endsRebuy);
            const fullBlindsLeft = this.levels().slice(this.currentLevelIndex() + 1, levelOfRebuyFinishedIndex + 1);
            const fullBlindsLeftTime = fullBlindsLeft.reduce((acc, curr) => curr.duration + acc, 0);

            const date = new Date();
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds((fullBlindsLeftTime * 60) + this.currentLevelTimeLeft(), 0);

            return date;
        });

        this.initTimeValues();
        this.initCountdownConfig();

        this.started = computed(() => this.state.settings().started);
        this.elapsed = this.state.elapsed;

        setInterval(() => {
            this.today = computed(() => Date.now());
        }, 100);

        this.fetchService.getResetTrigger$().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                this.initTimeValues();
                this.initCountdownConfig();
                this.state.pauseTimer();
                this.state.markForReset.set(false);
            })
        ).subscribe();
    }

    ngAfterViewInit(): void {
        if (this.state.isProOrAdmin()) {
            this.slider = new KeenSlider(this.sliderRef.nativeElement, {
                loop: true,
                initial: this.currentSlide(),
                slideChanged: (s: any) => {
                    this.currentSlide.set(s.track.details.rel);
                }
            });

            interval(20000).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => {
                    if (this.state.autoSlide() && !this.state.forceStopSlide()) {
                        this.slider.next();
                    }
                })
            ).subscribe();
        }
    }

    private initTimeValues(): void {
        const fromSettings = this.state.settings();

        if (fromSettings) {
            this.currentLevelTimeLeft.set(fromSettings.timeLeft);
            this.blindDuration.set(fromSettings.timeLeft);
            this.currentLevelIndex.set(fromSettings.levelIndex);
        } else {
            this.currentLevelTimeLeft.set(this.levels()[this.currentLevelIndex()].duration * 60);
            this.blindDuration.set(this.levels()[this.currentLevelIndex()].duration * 60);
        }

        if (this.levels()[this.currentLevelIndex()]) {
            this.blindDurationFixed.set(this.levels()[this.currentLevelIndex()].duration * 60);
        } else {
            this.blindDurationFixed.set(0);
        }
    }

    private initCountdownConfig(): void {
        this.countdownConfig = signal({
            leftTime: this.currentLevelTimeLeft(),
            format: 'mm:ss',
            notify: 0,
            demand: true,
        });
    }

    handleEvent(e: CountdownEvent) {
        if (e.action === 'done') {
            if (!this.firstDonePassed) {
                this.firstDonePassed = true;
            } else {
                this.blockNotifications = true;
            }

            this.state.currentLevelIndex.update(previous => previous + 1);

            if (this.currentLevelIndex() < this.levels().length) {
                setTimeout(() => {
                    this.currentLevelTimeLeft.set(this.levels()[this.currentLevelIndex()].duration * 60);
                    this.blindDuration.set(this.currentLevelTimeLeft());
                    this.blindDurationFixed.set(this.currentLevelTimeLeft());

                    this.countdownConfig.update(current => ({
                        ...current,
                        leftTime: this.currentLevelTimeLeft()
                    }));

                    if (!this.state.blockPut()) {
                        this.tournamentApiService.putTournamentSettings$({
                            ...this.state.settings(),
                            levelIndex: this.currentLevelIndex(),
                            timeLeft: this.currentLevelTimeLeft()
                        }).pipe(take(1)).subscribe();
                    }

                    if (this.state.isRunning()) {
                        setTimeout(() => {
                            this.countdown.begin();
                            this.blockNotifications = false;
                        }, 20);
                    }

                }, 1000);
            }
        }

        if (!this.blockNotifications) {
            if (e.action === 'notify') {
                this.currentLevelTimeLeft.set(e.left / 1000);

                if (this.currentLevelTimeLeft() === 60 && this.warning) {
                    this.warning.nativeElement.play();
                }

                if (this.currentLevelTimeLeft() === 0 && this.bleepNext) {
                    this.bleepNext.nativeElement.play();
                }

                if (!this.state.blockPut()) {
                    this.tournamentApiService.putTournamentSettings$({
                        ...this.state.settings(),
                        levelIndex: this.currentLevelIndex(),
                        timeLeft: this.currentLevelTimeLeft()
                    }).pipe(take(1)).subscribe();
                }
            }
        }
    }

    addMinute(): void {
        this.countdown.pause();
        this.currentLevelTimeLeft.update(current => current + 60);

        if (this.countdownConfig().leftTime) {
            this.countdownConfig.update(current => ({
                ...current,
                leftTime: this.currentLevelTimeLeft()
            }));

            if (this.state.isRunning()) {
                setTimeout(() => {
                    this.countdown.resume();
                }, 20);
            }
        }
    }

    goToNextLevel(): void {
        this.handleEvent({
            status: CountdownStatus.done,
            action: 'done',
            left: 0,
            text: ''
        });
    }

    goToPreviousLevel(): void {
        if (this.currentLevelIndex() > 0) {
            this.currentLevelIndex.update(previous => previous - 2);

            this.handleEvent({
                status: CountdownStatus.done,
                action: 'done',
                left: 0,
                text: ''
            });
        }
    }

    addBlind(): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            ...DEFAULT_DIALOG_POSITION,
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe();
    }

}
