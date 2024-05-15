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
import { tap } from 'rxjs/operators';
import { BlindLevel } from 'src/app/shared/models/blind-level.interface';
import { CountdownComponent, CountdownConfig, CountdownEvent, CountdownStatus } from 'ngx-countdown';
import { Tournament } from '../../../../shared/models/tournament.interface';
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
import { LocalStorageService } from '../../../../core/services/util/local-storage.service';
import { ButtonsComponent } from './buttons/buttons.component';
import { BlindLevelTextPipe } from '../../../../shared/pipes/blind-level-text.pipe';
import { TimePipe } from '../../../../shared/pipes/time.pipe';
import { LeaderboardInfoComponent } from './leaderboard/leaderboard-info.component';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { SeriesMetadata } from '../../../../shared/models/series.interface';
import { DEFAULT_DIALOG_POSITION } from '../../../../core/const/app.const';
import { TimerStateService } from '../../../services/timer-state.service';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
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
    isFinished: WritableSignal<boolean>;
    currentLevelIndex: WritableSignal<number>;
    isTournamentPartOfSeries: WritableSignal<boolean> = signal(false);
    isRunning: WritableSignal<boolean>;
    levels: Signal<BlindLevel[]>;

    slider: KeenSliderInstance;
    currentSlide: WritableSignal<number> = signal(0);

    currentLevelTimeLeft: WritableSignal<number> = signal(0);
    blindDuration: WritableSignal<number> = signal(0);
    blindDurationFixed: WritableSignal<number> = signal(0);

    today: Signal<number> = signal(Date.now());

    countdownConfig: WritableSignal<CountdownConfig>;

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('bleepNext') bleepNext!: ElementRef;
    @ViewChild('cd') countdown!: CountdownComponent;
    @ViewChild('sliderRef') sliderRef: ElementRef<HTMLElement>;

    @ViewChild(BlindLevelOverviewComponent) blindCmp: BlindLevelOverviewComponent;
    @ViewChild(ButtonsComponent) buttonsCmp: ButtonsComponent;

    private dialog: MatDialog = inject(MatDialog);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private state: TimerStateService = inject(TimerStateService);

    @HostListener('window:keyup.space', ['$event'])
    onKeydownHandler(event: Event) {
        event.preventDefault();

        if (this.state.isRunning()) {
            this.state.pauseTimer();
        } else {
            this.state.startTimer();
        }
    }

    _runningEffect = effect(() => {
        if (this.state.isRunning()) {
            this.countdown.resume();
        } else {
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
        this.isTournamentPartOfSeries.set(this.metadata() !== undefined);

        this.initTimeValues();
        this.initCountdownConfig();

        this.state.isTournamentFinished.set(
            !this.state.isSimpleTournament()
            && this.tournament().players.length === this.tournament().finishes.length
            && this.tournament().players.length > 0
        );

        this.checkIsRebuyPhaseFinished();

        setInterval(() => {
            this.today = computed(() => Date.now());
        }, 100);
    }

    ngAfterViewInit(): void {
        this.slider = new KeenSlider(this.sliderRef.nativeElement, {
            loop: true,
            initial: this.currentSlide(),
            slideChanged: (s: any) => {
                this.currentSlide.set(s.track.details.rel);
            }
        });

        interval(30000).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                if (this.state.autoSlide()) {
                    this.slider.next();
                }
            })
        ).subscribe();
    }

    private initTimeValues(): void {
        const fromLocalStorage = this.localStorageService.getTournamentStateById(this.tournament().id);

        if (fromLocalStorage) {
            this.currentLevelTimeLeft.set(fromLocalStorage.timeLeft);
            this.blindDuration.set(fromLocalStorage.timeLeft);
            this.currentLevelIndex.set(fromLocalStorage.levelIndex);
        } else {
            this.currentLevelTimeLeft.set(this.levels()[this.currentLevelIndex()].duration * 60);
            this.blindDuration.set(this.levels()[this.currentLevelIndex()].duration * 60);
        }

        this.blindDurationFixed.set(this.levels()[this.currentLevelIndex()].duration * 60);
    }

    private initCountdownConfig(): void {
        this.countdownConfig = signal({
            leftTime: this.currentLevelTimeLeft(),
            format: 'mm:ss',
            notify: 0,
            demand: true,
        });
    }

    private checkIsRebuyPhaseFinished(): void {
        const rebuyEndLevel = this.tournament().structure.findIndex(b => b.endsRebuy);
        this.state.isRebuyPhaseFinished.set(
            (
                this.currentLevelIndex() > rebuyEndLevel
                || rebuyEndLevel === -1
            )
            && this.tournament().players.length > 0
        );
    }

    handleEvent(e: CountdownEvent) {
        if (e.action === 'done') {
            this.currentLevelIndex.update(previous => previous + 1);
            this.checkIsRebuyPhaseFinished();

            if (this.currentLevelIndex() === this.levels.length) {
                this.state.isTournamentFinished.set(true);
            } else {
                setTimeout(() => {
                    this.currentLevelTimeLeft.set(this.levels()[this.currentLevelIndex()].duration * 60);
                    this.blindDuration.set(this.currentLevelTimeLeft());
                    this.blindDurationFixed.set(this.currentLevelTimeLeft());

                    this.countdownConfig.update(current => ({
                        ...current,
                        leftTime: this.currentLevelTimeLeft()
                    }));

                    this.localStorageService.storeTournamentState(
                        this.tournament().id,
                        this.currentLevelIndex(),
                        this.currentLevelTimeLeft()
                    );

                    if (this.state.isRunning()) {
                        setTimeout(() => {
                            this.countdown.begin();
                        }, 20);
                    }

                }, 1000);
            }
        }

        if (e.action === 'notify') {
            this.currentLevelTimeLeft.set(e.left / 1000);

            if (this.currentLevelTimeLeft() === 60 && this.warning) {
                this.warning.nativeElement.play();
            }

            if (this.currentLevelTimeLeft() === 0 && this.bleepNext) {
                this.bleepNext.nativeElement.play();
            }

            this.localStorageService.storeTournamentState(
                this.tournament().id,
                this.currentLevelIndex(),
                this.currentLevelTimeLeft()
            );
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
        this.currentLevelIndex.update(previous => previous - 2);

        this.handleEvent({
            status: CountdownStatus.done,
            action: 'done',
            left: 0,
            text: ''
        });
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
