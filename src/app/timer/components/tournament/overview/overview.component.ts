import { AfterViewInit, Component, ElementRef, HostListener, inject, Input, OnChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, iif, Observable, of } from 'rxjs';
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

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnChanges, AfterViewInit {

    @Input() tournament: Tournament;
    @Input() isSimpleTournament: boolean;
    @Input() playersInTheHole: Player[] | null;
    @Input() formulaId: number | null;

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

    resize$: BehaviorSubject<{ width: number; height: number }>;

    radius$: Observable<number> = of(200);
    radius = window.innerHeight * 0.6 * 0.4;
    innerStroke$: Observable<number> = of(10);
    innerStroke = window.innerHeight * 0.01;
    outerStroke$: Observable<number> = of(32);
    outerStroke = window.innerHeight * 0.05;

    private dialog: MatDialog = inject(MatDialog);

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('bleepNext') bleepNext!: ElementRef;
    @ViewChild('cd') countdown!: CountdownComponent;
    @ViewChild('sliderRef') sliderRef: ElementRef<HTMLElement>;

    @ViewChild(ChipsOverviewComponent) chips: ChipsOverviewComponent;
    @ViewChild(PlayerOverviewComponent) playersCmp: PlayerOverviewComponent;
    @ViewChild(BuyinOverviewComponent) buyInCmp: BuyinOverviewComponent;
    @ViewChild(PlayerDetailsComponent) playersDCmp: PlayerDetailsComponent;
    @ViewChild(PayoutDetailsComponent) payoutCmp: PayoutDetailsComponent;
    @ViewChild(RankingComponent) rankingCmp: RankingComponent;
    @ViewChild(BlindLevelOverviewComponent) blindCmp: BlindLevelOverviewComponent;

    slider: KeenSliderInstance;
    currentSlide: number = 0;

    private entryApiService: EntryApiService = inject(EntryApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private blindApiService: BlindLevelApiService = inject(BlindLevelApiService);

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

    ngOnChanges(): void {
        if (this.tournament && this.tournament.structure.length > 0) {
            this.levels = this.tournament.structure;

            this.initResizeListener();
            this.initLevels();
            this.initTimeValues();
            this.initCountdownConfig();
            this.initRadius();
            this.initInnerStroke();
            this.initOuterStroke();

            this.finished = !this.isSimpleTournament && this.tournament.players.length === this.tournament.finishes.length;
        }

        if (this.playersInTheHole) {
            this.playersInTheHole.forEach(
                (player: Player) => this.entryApiService.post$({
                    id: undefined,
                    playerId: player.id ?? -1,
                    type: 'ENTRY',
                    tournamentId: this.tournament.id ?? -1
                }).pipe(
                    tap(() => this.tournament.entries.push({
                        id: undefined,
                        playerId: player.id ?? -1,
                        type: 'ENTRY',
                        tournamentId: this.tournament.id ?? -1
                    })),
                    tap(() => this.refreshViews())
                ).subscribe()
            );
        }
    }

    ngAfterViewInit(): void {
        this.slider = new KeenSlider(this.sliderRef.nativeElement, {
            loop: true,
            initial: this.currentSlide,
            slideChanged: (s: any) => this.currentSlide = s.track.details.rel
        });

        // interval(20000).pipe(
        //     tap(() => this.slider.next())
        // ).subscribe();
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
        this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].duration * 60;
        this.blindDuration = this.levels[this.currentLevelIndex].duration * 60;
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

    handleEvent(e: CountdownEvent) {
        if (e.action === 'done') {
            this.showTimer = false;
            this.currentLevelIndex++;

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

                    setTimeout(() => {
                        this.countdown.begin();
                    }, 20);

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

    createPlayer(): void {
        this.dialog.open(CreatePlayerComponent);
    }

    addBlind(): void {
        const dialogRef = this.dialog.open(AddBlindsComponent, {
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { blindId: number }) => this.blindApiService.getOfTournament$(this.tournament.id ?? -1)),
            tap((blinds: BlindLevel[]) => this.tournament.structure = blinds),
            tap(() => {
                if (this.tournament.structure.length === 1) {
                    this.ngOnChanges();
                }
            }),
            tap((a) => this.refreshViews())
        ).subscribe();
    }

    addPlayer(): void {
        const dialogRef = this.dialog.open(AddPlayerComponent, {
            data: {
                tournament: this.tournament
            }
        });

        let playerId: number;
        let entryId: number;

        dialogRef.afterClosed().pipe(
            tap((res: { entryId: number, playerId: number }) => {
                playerId = res.playerId;
                entryId = res.entryId;
            }),
            switchMap(() => this.entryApiService.get$(entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            switchMap(() => this.playerApiService.get$(playerId)),
            tap((player: Player) => this.tournament.players.push(player)),
            tap(() => {
                this.playersCmp.ngOnChanges();
                this.playersDCmp.ngOnChanges();
                this.buyInCmp.ngOnChanges();
                this.chips.ngOnChanges();
                this.payoutCmp.ngOnChanges();
                this.blindCmp.ngOnChanges();
            })
        ).subscribe();
    }

    addRebuy(): void {
        const dialogRef = this.dialog.open(AddRebuyComponent, {
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews())
        ).subscribe();
    }

    addAddon(): void {
        const dialogRef = this.dialog.open(AddAddonComponent, {
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { entryId: number }) => this.entryApiService.get$(res.entryId)),
            tap((entry: Entry) => this.tournament.entries.push(entry)),
            tap((a) => this.refreshViews())
        ).subscribe();
    }

    seatOpen(): void {
        const dialogRef = this.dialog.open(AddFinishComponent, {
            data: {
                tournament: this.tournament
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((res: { finishId: number }) => this.finishApiService.getInTournament$(this.tournament.id ?? 0)),
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
            switchMap(() => this.finishApiService.getInTournament$(this.tournament.id ?? 0)),
            tap((finish: Finish[]) => this.tournament.finishes = finish),
            tap((a) => this.refreshViews())
        ).subscribe();
    }

    private refreshViews(): void {
        this.playersCmp.ngOnChanges();
        this.playersDCmp.ngOnChanges();
        this.buyInCmp.ngOnChanges();
        this.chips.ngOnChanges();
        this.payoutCmp.ngOnChanges();
        this.rankingCmp.ngOnChanges();
    }

    private getRemainingFinish(): Finish {
        const playerId = this.tournament.players.filter(
            (player: Player) => {
                const finishIds = this.tournament.finishes.map(f => f.playerId);

                return !finishIds.includes(player.id ?? 0);
            }
        )[0].id ?? 0;

        const payoutRaw = this.tournament.payout.split(' ');
        const payoutPercentage = +payoutRaw[0];

        const totalMoney = this.tournament.entries.filter(
                (entry: Entry) => entry.type !== 'ADDON'
            ).length * this.tournament.buyIn
            + this.tournament.entries.filter(e => e.type === 'ADDON').length * this.tournament.addon;

        const price = totalMoney / 100 * payoutPercentage;

        return {
            rank: 1,
            tournamentId: this.tournament.id ?? 0,
            price,
            playerId
        };
    }

}
