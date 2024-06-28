import { Component, effect, input } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgStyle, NgTemplateOutlet } from '@angular/common';

// @ts-ignore
import confetti from 'canvas-confetti';
import { billPath, skullPath } from './animation-paths.const';
import { RankPipe } from '../rank.pipe';

declare var anime: any;

@Component({
    selector: 'app-animation-seat-open',
    templateUrl: './animation-seat-open.component.html',
    standalone: true,
    imports: [
        DecimalPipe,
        NgTemplateOutlet,
        AsyncPipe,
        NgStyle,
        RankPipe
    ]
})
export class AnimationSeatOpenComponent {

    isAnimating = input.required<boolean>();
    name = input.required<string>();
    price = input.required<number>();
    rank = input.required<number>();

    _confettiEffect = effect(() => {
        if (this.isAnimating()) {
            this.doConfetti();
        }
    });

    config = Array.from({length: 100}).map(
        _ => ({
            duration: Math.floor(Math.random() * (20 - 6 + 1) + 6),
            left: Math.floor(Math.random() * (90 - 10 + 1) + 10)
        })
    );

    doConfetti(withRandom = false): void {
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
            delay: 1000,
        });

        setTimeout(
            () => {
                this.shoot(withRandom);
            },
            2000
        );
    }

    shoot(withRandom = false) {
        try {
            const skull = confetti.shapeFromPath({path: skullPath});
            const bill = confetti.shapeFromPath({path: billPath});

            confetti({
                angle: 90,
                particleCount: 1000,
                spread: 360,
                scalar: 3,
                origin: {
                    y: withRandom ? Math.random() : 0.4,
                    x: withRandom ? Math.random() : 0.5,
                },
                shapes: [this.price() > 0 ? bill : skull]
            });

        } catch (e) {
            // noop, confettijs may not be loaded yet
            console.log('error confetti', e);
        }
    }

    random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

}
