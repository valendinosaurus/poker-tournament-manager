import {Component, ElementRef, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';
import {blindLevelsNoAnte} from 'src/app/shared/data/blind-levels.const';
import {BlindLevel} from 'src/app/shared/models/blind-level.interface';
import {Pause} from 'src/app/shared/models/pause.interface';
import {CountdownComponent, CountdownConfig, CountdownEvent} from "ngx-countdown";

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
    @Input() levels: (BlindLevel | Pause)[] = blindLevelsNoAnte;

    currentLevelIndex = 0;
    currentLevelTimeLeft: number = 0;
    currentTimeLeftPercentage: number = 100;

    showTimer = true;
    running = false;
    finished = false;

    config!: CountdownConfig;

    resize$ = new BehaviorSubject<{ width: number; height: number }>({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    blindDuration: number = 0;
    blindDurationFixed: number = 0;
    radius$: Observable<number> = of(200);
    radius = window.innerHeight * 0.6 * 0.4;
    innerStroke$: Observable<number> = of(10);
    innerStroke = window.innerHeight * 0.01;
    outerStroke$: Observable<number> = of(32);
    outerStroke = window.innerHeight * 0.05;

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('next') next!: ElementRef;
    @ViewChild('cd') countdown!: CountdownComponent;

    @HostListener('window:resize', ['$event.target'])
    onResize(target: any): void {
        this.resize$.next({
            width: target.innerWidth,
            height: target.innerHeight,
        });
    }

    @HostListener('window:keyup', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
        if (event.keyCode === 32) {
            if (this.running) {
                this.pause();
            } else {
                this.start();
            }
        }
    }

    ngOnInit(): void {
        this.initTourney();
    }

    initTourney(): void {
        this.levels = this.levels.map((level) => ({
            ...level,
        }));

        this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].durationMinutes;
        this.blindDuration = this.levels[this.currentLevelIndex].durationMinutes;
        this.blindDurationFixed = this.levels[this.currentLevelIndex].durationMinutes;

        this.config = {
            leftTime: this.currentLevelTimeLeft,
            format: 'mm:ss',
            notify: 0,
            demand: true,
        }

        this.initRadius();
        this.initInnerStroke();
        this.initOuterStroke();
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
                    this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].durationMinutes;
                    this.blindDuration = this.currentLevelTimeLeft;
                    this.blindDurationFixed = this.currentLevelTimeLeft;
                    this.currentTimeLeftPercentage = 100;
                    this.showTimer = true;
                    this.config = {
                        ...this.config,
                        leftTime: this.currentLevelTimeLeft
                    };

                    setTimeout(() => {
                        this.countdown.begin();
                    }, 20)

                }, 1000);
            }
        }

        if (e.action === 'notify') {
            this.currentLevelTimeLeft = e.left / 1000;

            if (this.currentLevelTimeLeft === 60 && this.warning) {
                this.warning.nativeElement.play();
            }

            if (this.currentLevelTimeLeft === 0 && this.next) {
                this.next.nativeElement.play();
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
        this.currentLevelTimeLeft += 3;

        if (this.config.leftTime) {
            this.config = {
                ...this.config,
                leftTime: this.config.leftTime + 3
            };
            if (this.running) {
                this.countdown.resume();

                setTimeout(() => {
                    this.countdown.resume()
                }, 20)
            }
        }
    }
}
