import { Component, Input, input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { DecimalPipe, NgStyle, NgTemplateOutlet } from '@angular/common';
import { of, range, Subject, Subscription } from 'rxjs';
import { concatMap, delay, tap } from 'rxjs/operators';

// @ts-ignore
import confetti from 'canvas-confetti';
import { billPath } from '../animation-seat-open/animation-paths.const';

declare var anime: any;

@Component({
    selector: 'app-animation-winner',
    standalone: true,
    imports: [
        DecimalPipe,
        NgTemplateOutlet,
        NgStyle
    ],
    templateUrl: './animation-winner.component.html',
})
export class AnimationWinnerComponent implements OnChanges {

    @Input() trigger: number | null;
    name = input.required<string>();
    price = input.required<number>();

    isAnimating = signal(false);

    intervalSubscription: Subscription;
    destroy$ = new Subject<void>();

    config = Array.from({length: 100}).map(
        _ => ({
            duration: Math.floor(Math.random() * (20 - 6 + 1) + 6),
            left: Math.floor(Math.random() * (90 - 10 + 1) + 10)
        })
    );

    ngOnChanges(changes: SimpleChanges): void {
        if (!!changes['trigger']?.currentValue) {
            this.isAnimating.set(true);

            anime.timeline({loop: false})
                .add({
                    targets: '.winner-animation .word',
                    scale: [14, 1],
                    opacity: [0, 1],
                    easing: 'easeInOutQuad',
                    duration: 400,
                    delay: (el: any, i: number) => 500 * i
                }).add({
                targets: '.winner-animation',
                opacity: 0,
                duration: 1000,
                easing: 'easeInOutQuad',
                delay: 1000
            });

            this.shoot(false);

            if (this.intervalSubscription) {
                this.intervalSubscription.unsubscribe();
            }

            this.intervalSubscription = range(0, 20).pipe(
                concatMap(i => of(i).pipe(
                    delay(1000 + Math.random() * 2500),
                    tap(() => {
                        this.shoot(true);
                    })
                )),
            ).subscribe();

        }
    }

    shoot(withRandom = false) {
        try {
            const bill = confetti.shapeFromPath({path: billPath});

            confetti({
                angle: 90,
                particleCount: 500,
                spread: 360,
                scalar: 3,
                origin: {
                    y: withRandom ? Math.random() : 0.4,
                    x: withRandom ? Math.random() : 0.5,
                },
                shapes: [bill, 'start'],
            });
        } catch (e) {
            // noop, confettijs may not be loaded yet
        }
    }

    random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    endWinnerAnimation(): void {
        this.isAnimating.set(false);
        this.destroy$.next();
        this.intervalSubscription.unsubscribe();
    }

}
