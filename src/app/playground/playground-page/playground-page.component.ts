import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

declare var anime: any;

@Component({
    selector: 'app-playground-page',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './playground-page.component.html',
    styleUrls: ['./playground-page.component.scss']
})
export class PlaygroundPageComponent {

    isAnimating = false;
    lastIsBubble = true;
    lastPrice = 20;
    lastSeatOpenName = 'NAME';

    config = Array.from({length: 100}).map(
        _ => ({
            duration: Math.floor(Math.random() * (20 - 6 + 1) + 6),
            left: Math.floor(Math.random() * (90 - 10 + 1) + 10)
        })
    );

    config2 = Array.from({length: 100}).map(
        _ => ({
            duration: Math.floor(Math.random() * (20 - 6 + 1) + 6),
            left: Math.floor(Math.random() * (90 - 10 + 1) + 10)
        })
    );

    doConfetti(): void {
        this.isAnimating = true;

        setTimeout(() => this.isAnimating = false, 6000);

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
                this.shoot();
            },
            2000
        );
    }

    shoot() {
        try {
            this.confetti({
                angle: 90,
                spread: 360,
                particleCount: this.random(4000, 5000),
                origin: {
                    y: 0.4
                }
            });
        } catch (e) {
            // noop, confettijs may not be loaded yet
        }
    }

    random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    confetti(args: any) {
        // @ts-ignore
        return window['confetti'].apply(this, arguments);
    }

}
