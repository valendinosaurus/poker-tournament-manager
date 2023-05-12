import {Component, ElementRef, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';
import {blindLevelsNoAnte} from 'src/app/shared/data/blind-levels.const';
import {BlindLevel} from 'src/app/shared/models/blind-level.interface';
import {Pause} from 'src/app/shared/models/pause.interface';

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

    showTimer = true;
    running = false;
    finished = false;

    @ViewChild('warning') warning!: ElementRef;
    @ViewChild('next') next!: ElementRef;

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

        this.currentLevelTimeLeft = this.levels[this.currentLevelIndex].durationMinutes * 60;
        this.blindDuration =
            this.levels[this.currentLevelIndex].durationMinutes * 60;

        this.blindDurationFixed =
            this.levels[this.currentLevelIndex].durationMinutes * 60;

        this.radius$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.6 * 0.4)
        );

        this.innerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.01)
        );

        this.outerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.05)
        );
    }

    onValue(event: number): void {
        this.currentLevelTimeLeft = event;

        if (this.currentLevelTimeLeft === 60 && this.warning) {
            this.warning.nativeElement.play();
        }

        if (this.currentLevelTimeLeft === 0 && this.next) {
            this.next.nativeElement.play();
        }

        this.currentTimeLeftPercentage =
            (this.currentLevelTimeLeft / this.blindDurationFixed) * 100;

        if (this.currentLevelTimeLeft === 0) {
            this.showTimer = false;
            this.currentLevelIndex++;

            if (this.currentLevelIndex === this.levels.length) {
                this.finished = true;
            } else {
                setTimeout(() => {
                    this.currentLevelTimeLeft =
                        (this.levels[this.currentLevelIndex].durationMinutes * 60) + 1;
                    this.blindDuration = this.currentLevelTimeLeft;

                    this.blindDurationFixed = this.currentLevelTimeLeft;
                    this.currentTimeLeftPercentage = 100;
                    this.showTimer = true;

                }, 1000);

            }
        }
    }

    addMinute(): void {
        this.blindDuration += 60;
    }

    start(): void {
        if (!this.running) {
            this.running = true;
        }
    }

    pause(): void {
        if (this.running) {
            this.running = false;
            this.blindDuration = this.currentLevelTimeLeft + 1;
        }
    }
}
