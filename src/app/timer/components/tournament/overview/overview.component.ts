import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    inject,
    Input,
    OnChanges,
    QueryList,
    SimpleChanges,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { BehaviorSubject, iif, interval, Observable, of, ReplaySubject } from 'rxjs';
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { BlindLevel } from 'src/app/shared/models/blind-level.interface';
import { CountdownComponent, CountdownConfig, CountdownEvent, CountdownStatus } from 'ngx-countdown';
import { Tournament } from '../../../../shared/models/tournament.interface';

import KeenSlider, { KeenSliderInstance } from 'keen-slider';
import { MatDialog } from '@angular/material/dialog';
import { CreatePlayerComponent } from '../../../../admin/components/player/create-player/create-player.component';
import { AddPlayerComponent } from '../../../../admin/components/dialogs/add-player/add-player.component';
import { EntryApiService } from '../../../../core/services/api/entry-api.service';
import { Entry } from '../../../../shared/models/entry.interface';
import { PlayerApiService } from '../../../../core/services/api/player-api.service';
import { Player } from '../../../../shared/models/player.interface';
import { ChipsOverviewComponent } from '../chips-overview/chips-overview.component';
import { PlayerOverviewComponent } from '../player-overview/player-overview.component';
import { AddRebuyComponent } from '../../../../admin/components/dialogs/add-rebuy/add-rebuy.component';
import { BuyinOverviewComponent } from '../buyin-overview/buyin-overview.component';
import { AddAddonComponent } from '../../../../admin/components/dialogs/add-addon/add-addon.component';
import { PlayerDetailsComponent } from '../player-details/player-details.component';
import { AddFinishComponent } from '../../../../admin/components/dialogs/add-finish/add-finish.component';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { Finish } from '../../../../shared/models/finish.interface';
import { PayoutDetailsComponent } from '../payout-details/payout-details.component';
import { BlindLevelOverviewComponent } from '../blind-level-overview/blind-level-overview.component';
import { AddBlindsComponent } from '../../../../admin/components/dialogs/add-blinds/add-blinds.component';
import { BlindLevelApiService } from '../../../../core/services/api/blind-level-api.service';
import { RankingComponent } from '../ranking/ranking.component';
import { RankingService } from '../../../../core/services/util/ranking.service';
import { AddReEntryComponent } from '../../../../admin/components/dialogs/add-re-entry/add-re-entry.component';
import { SeriesMetadata } from '../../../../shared/models/series-metadata.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalStorageService } from '../../../../core/services/util/local-storage.service';
import { MakeDealComponent } from '../../../../admin/components/dialogs/make-deal/make-deal.component';
import { EventApiService } from '../../../../core/services/api/event-api.service';
import { ServerResponse } from '../../../../shared/models/server-response';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnChanges, AfterViewInit {

    @Input() randomId: number;
    @Input() tournament: Tournament;
    @Input() sub: string | undefined;
    @Input() isSimpleTournament: boolean;
    @Input() playersInTheHole: Player[] | null;
    @Input() seriesMetadata: SeriesMetadata | null;

    levels: BlindLevel[];

    currentLevelIndex = 0;
    currentLevelTimeLeft: number = 0;
    currentTimeLeftPercentage: number = 100;
    blindDuration: number = 0;
    blindDurationFixed: number = 0;
    showTimer = true;
    running = false;
    finished = false;

    countdownConfig: CountdownConfig;

    isRebuyPhaseFinished = false;

    resize$: BehaviorSubject<{ width: number; height: number }>;

    radius$: Observable<number> = of(200);
    radius = window.innerHeight * 0.6 * 0.4;
    innerStroke$: Observable<number> = of(10);
    innerStroke = window.innerHeight * 0.01;
    outerStroke$: Observable<number> = of(32);
    outerStroke = window.innerHeight * 0.05;

    scrollTrigger$: ReplaySubject<string> = new ReplaySubject<string>();

    private dialog: MatDialog = inject(MatDialog);
    autoSlide = true;

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('bleepNext') bleepNext!: ElementRef;
    @ViewChild('cd') countdown!: CountdownComponent;
    @ViewChild('sliderRef') sliderRef: ElementRef<HTMLElement>;

    @ViewChildren(ChipsOverviewComponent) chips: QueryList<ChipsOverviewComponent>;
    @ViewChildren(PlayerOverviewComponent) playersCmp: QueryList<PlayerOverviewComponent>;
    @ViewChildren(BuyinOverviewComponent) buyInCmp: QueryList<BuyinOverviewComponent>;
    @ViewChild(PlayerDetailsComponent) playersDCmp: PlayerDetailsComponent;
    @ViewChild(PayoutDetailsComponent) payoutCmp: PayoutDetailsComponent;
    @ViewChild(RankingComponent) rankingCmp: RankingComponent;
    @ViewChild(BlindLevelOverviewComponent) blindCmp: BlindLevelOverviewComponent;

    slider: KeenSliderInstance;
    currentSlide: number = 0;

    autoGeneratedEntryIds: number[] = [];

    changes = 0;

    private entryApiService: EntryApiService = inject(EntryApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private rankingService: RankingService = inject(RankingService);
    private destroyRef: DestroyRef = inject(DestroyRef);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private eventApiService: EventApiService = inject(EventApiService);

    @HostListener('window:resize', ['$event.target'])
    onResize(target: any): void {
        this.resize$.next({
            width: target.innerWidth,
            height: target.innerHeight,
        });
    }

    @HostListener('window:keyup.space', ['$event'])
    onKeydownHandler(event: Event) {
        event.preventDefault();

        if (this.running) {
            this.pause();
        } else {
            this.start();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.tournament && this.tournament.structure.length > 0) {
            console.log('tournament changed');
            this.levels = this.tournament.structure;

            this.initResizeListener();
            this.initLevels();
            this.initTimeValues();
            this.initCountdownConfig();
            this.initRadius();
            this.initInnerStroke();
            this.initOuterStroke();

            this.finished = !this.isSimpleTournament
                && this.tournament.players.length === this.tournament.finishes.length
                && this.tournament.players.length > 0;

            this.checkIsRebuyPhaseFinished();

            if (this.changes > 1) {
                console.log('**** LIVE CHANGE');
                console.log(this.running);
                setTimeout(() => {
                    this.countdown.resume();
                }, 400);
            }

            this.changes++;
        }
    }

    ngAfterViewInit(): void {
        this.slider = new KeenSlider(this.sliderRef.nativeElement, {
            loop: true,
            initial: this.currentSlide,
            slideChanged: (s: any) => {
                this.currentSlide = s.track.details.rel;
            }
        });

        let index = 0;

        interval(5000).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                if (this.autoSlide) {
                    index++;

                    if (index % 6 === 0) {
                        this.slider.next();
                    }
                }

                this.scrollTrigger$.next('SCROLL');
            })
        ).subscribe();
    }

    private initResizeListener(): void {
        this.resize$ = new BehaviorSubject<{ width: number; height: number }>({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }

    private initLevels(): void {
        this.levels = this.levels.map((level) => ({
            ...level,
        }));
    }

    private initTimeValues(): void {
        const fromLocalStorage = this.localStorageService.getTournamentStateById(this.tournament.id);

        if (fromLocalStorage) {
            this.currentLevelTimeLeft = fromLocalStorage.timeLeft;
            this.blindDuration = fromLocalStorage.timeLeft;
            this.currentLevelIndex = fromLocalStorage.levelIndex;
        } else {
            this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].duration * 60;
            this.blindDuration = this.levels[this.currentLevelIndex].duration * 60;
        }

        this.blindDurationFixed = this.levels[this.currentLevelIndex].duration * 60;
    }

    private initCountdownConfig(): void {
        this.countdownConfig = {
            leftTime: this.currentLevelTimeLeft,
            format: 'mm:ss',
            notify: 0,
            demand: true,
        };
    }

    private initRadius(): void {
        this.radius$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.6 * 0.4)
        );
    }

    private initInnerStroke(): void {
        this.innerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.01)
        );
    }

    private initOuterStroke(): void {
        this.outerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.05)
        );
    }

    private checkIsRebuyPhaseFinished(): void {
        const rebuyEndLevel = this.tournament.structure.findIndex(b => b.endsRebuy);
        this.isRebuyPhaseFinished = (this.currentLevelIndex > rebuyEndLevel || rebuyEndLevel === -1) && this.tournament.players.length > 0;
    }

    handleEvent(e: CountdownEvent) {
        if (this.changes > 1 && e.action === 'restart') {
            return;
        }

        if (e.action === 'done') {
            this.showTimer = false;
            this.currentLevelIndex++;
            this.checkIsRebuyPhaseFinished();

            if (this.currentLevelIndex === this.levels.length) {
                this.finished = true;
            } else {
                setTimeout(() => {
                    this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].duration * 60;
                    this.blindDuration = this.currentLevelTimeLeft;
                    this.blindDurationFixed = this.currentLevelTimeLeft;
                    this.currentTimeLeftPercentage = 100;
                    this.showTimer = true;
                    this.countdownConfig = {
                        ...this.countdownConfig,
                        leftTime: this.currentLevelTimeLeft
                    };

                    this.localStorageService.storeTournamentState(
                        this.tournament.id,
                        this.currentLevelIndex,
                        this.currentLevelTimeLeft
                    );

                    if (this.running) {
                        setTimeout(() => {
                            this.countdown.begin();
                        }, 20);
                    }

                }, 1000);
            }
        }

        if (e.action === 'notify') {
            this.currentLevelTimeLeft = e.left / 1000;

            if (this.currentLevelTimeLeft === 60 && this.warning) {
                this.warning.nativeElement.play();
            }

            if (this.currentLevelTimeLeft === 0 && this.bleepNext) {
                this.bleepNext.nativeElement.play();
            }

            this.currentTimeLeftPercentage = (this.currentLevelTimeLeft / this.blindDurationFixed) * 100;

            this.localStorageService.storeTournamentState(
                this.tournament.id,
                this.currentLevelIndex,
                this.currentLevelTimeLeft
            );
        }
    }

    start(): void {
        if (!this.running) {
            this.running = true;
            this.countdown.resume();
        }
    }

    pause(): void {
        if (this.running) {
            this.running = false;
            this.countdown.pause();
            this.blindDuration = this.currentLevelTimeLeft + 1;
        }
    }

    addMinute(): void {
        this.countdown.pause();
        this.currentLevelTimeLeft += 60;

        if (this.countdownConfig.leftTime) {
            this.countdownConfig = {
                ...this.countdownConfig,
                leftTime: this.currentLevelTimeLeft
            };
            if (this.running) {
                //       this.countdown.resume();

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
        this.currentLevelIndex -= 2;

        this.handleEvent({
            status: CountdownStatus.done,
            action: 'done',
            left: 0,
            text: ''
        });
    }

    createPlayer(): void {
        this.dialog.open(CreatePlayerComponent);
    }

    addBlind(): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((res: {
                blindId: number
            }) => this.blindApiService.getOfTournament$(this.tournament.id, this.sub ?? '')),
            tap((blinds: BlindLevel[]) => this.tournament.structure = blinds),
            tap(() => {
                if (this.tournament.structure.length === 1) {
                    this.ngOnChanges({} as any as SimpleChanges);
                }
            }),
            tap((a) => this.refreshViews())
        ).subscribe();
    }

    private sendRefetchEvent$(): Observable<ServerResponse> {
        return this.eventApiService.post$({
            id: null,
            tId: this.tournament.id,
            clientId: this.randomId
        });
    }

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament
            }
        });

        let playerId: number;
        let entryId: number | undefined;

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res: { entryId: number, playerId: number }) => {
                playerId = res.playerId;
                entryId = res.entryId;
            }),
            switchMap(() => this.playerApiService.get$(playerId, this.sub ?? '')),
            tap((player: Player) => this.tournament.players.push(player)),
            tap(() => this.refreshViews()),
            switchMap(() => iif(
                    () => entryId !== undefined,
                    this.entryApiService.get$(entryId ?? -1)).pipe(
                    tap((entry: Entry) => {
                        this.tournament.entries.push(entry);
                    })
                )
            ),
            tap(() => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    addReEntry(): void {
        const dialogRef = this.dialog.open(AddReEntryComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament,
                isReentry: true
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    addEntry(): void {
        const dialogRef = this.dialog.open(AddReEntryComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament,
                isReentry: false
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    makeDeal(): void {
        const dialogRef = this.dialog.open(MakeDealComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament,
                metadata: this.seriesMetadata
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((finishes: Finish[]) => this.tournament.finishes.push(...finishes)),
            tap(() => {
                this.refreshViews();

                if (this.tournament.players.length - this.tournament.finishes.length === 0) {
                    this.finished = true;
                }
            }),
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            position: {
                top: '40px'
            },
            data: {
                tournament: this.tournament,
                metadata: this.seriesMetadata,
            }
        });

        dialogRef.afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((res: { finishId: number }) => this.finishApiService.getInTournament$(this.tournament.id)),
            tap((finish: Finish[]) => this.tournament.finishes = finish),
            tap(() => {
                this.refreshViews();

                if (this.tournament.players.length - this.tournament.finishes.length === 1) {
                    this.finished = true;
                }
            }),
            switchMap(() => iif(
                () => this.finished,
                this.finishApiService.post$(this.getRemainingFinish()),
                of(null)
            )),
            switchMap(() => this.finishApiService.getInTournament$(this.tournament.id)),
            tap((finish: Finish[]) => this.tournament.finishes = finish),
            tap((a) => this.refreshViews()),
            switchMap(() => this.sendRefetchEvent$())
        ).subscribe();
    }

    private refreshViews(): void {
        this.playersCmp.forEach(e => e.ngOnChanges());
        this.playersDCmp.ngOnChanges({});
        this.buyInCmp.forEach(e => e.ngOnChanges());
        this.chips.forEach(e => e.ngOnChanges());
        this.payoutCmp.ngOnChanges({});
        this.rankingCmp.ngOnChanges({});

    }

    private getRemainingFinish(): Finish {
        const playerId = this.tournament.players.filter(
            (player: Player) => {
                const finishIds = this.tournament.finishes.map(f => f.playerId);

                return !finishIds.includes(player.id);
            }
        )[0].id;

        const payouts = this.rankingService.getPayoutById(this.tournament.payout);
        const payoutPercentage = +payouts[0];

        const {totalPricePool} = this.rankingService.getTotalPricePool(
            this.tournament.entries,
            this.tournament.buyInAmount,
            this.tournament.rebuyAmount,
            this.tournament.addonAmount,
            this.tournament.initialPricePool,
            this.seriesMetadata?.percentage,
            this.seriesMetadata?.maxAmountPerTournament
        );

        const price = totalPricePool / 100 * payoutPercentage;

        return {
            rank: 1,
            tournamentId: this.tournament.id,
            price,
            playerId
        };
    }

}
