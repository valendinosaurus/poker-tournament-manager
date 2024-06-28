import { Component, effect, input } from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';

// @ts-ignore
import confetti from 'canvas-confetti';
import { RankPipe } from '../rank.pipe';

declare var anime: any;

@Component({
    selector: 'app-animation-bubble-boy',
    standalone: true,
    imports: [
        DecimalPipe,
        NgTemplateOutlet,
        RankPipe
    ],
    templateUrl: './animation-bubble-boy.component.html',
})
export class AnimationBubbleBoyComponent {

    isAnimating = input.required<boolean>();
    name = input.required<string>();
    rank = input.required<number>();

    _confettiEffect = effect(() => {
        if (this.isAnimating()) {
            this.doConfetti();
        }
    });

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
            delay: 1000
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
            confetti({
                angle: 90,
                particleCount: 1000,
                spread: 360,
                scalar: 3,
                origin: {
                    y: withRandom ? Math.random() : 0.4,
                    x: withRandom ? Math.random() : 0.5,
                },
                shapes: ['circle']
            });
        } catch (e) {
            // noop, confettijs may not be loaded yet
        }
    }

    random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

}
