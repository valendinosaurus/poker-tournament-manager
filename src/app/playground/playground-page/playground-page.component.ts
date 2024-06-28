import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AnimationSeatOpenComponent } from '../../animation/animation-seat-open/animation-seat-open.component';
import { AnimationBubbleBoyComponent } from '../../animation/animation-bubble-boy/animation-bubble-boy.component';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { AnimationWinnerComponent } from '../../animation/animation-winner/animation-winner.component';

@Component({
    selector: 'app-playground-page',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        AnimationSeatOpenComponent,
        AnimationBubbleBoyComponent,
        AnimationWinnerComponent
    ],
    templateUrl: './playground-page.component.html',
    styleUrls: ['./playground-page.component.scss']
})
export class PlaygroundPageComponent {

    isAnimatingSeatOpen$ = new BehaviorSubject(false);
    isAnimatingBubbleBoy$ = new BehaviorSubject(false);
    winnerTrigger$ = new ReplaySubject<number>();

    seatOpen(): void {
        this.isAnimatingSeatOpen$.next(true);

        setTimeout(() => {
            this.isAnimatingSeatOpen$.next(false);
        }, 6000);
    }

    seatBubbleBoy(): void {
        this.isAnimatingBubbleBoy$.next(true);

        setTimeout(() => {
            this.isAnimatingBubbleBoy$.next(false);
        }, 6000);
    }

    winner(): void {
        this.winnerTrigger$.next(Math.random());
    }

}
