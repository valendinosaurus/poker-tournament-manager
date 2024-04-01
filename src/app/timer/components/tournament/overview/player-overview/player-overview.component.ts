import { Component, HostListener, Input, OnChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

@Component({
    selector: 'app-player-overview',
    templateUrl: './player-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
})
export class PlayerOverviewComponent implements OnChanges {

    @Input() players: Player[];
    @Input() finishes: Finish[];

    text: string = '';
    percentageIn: number = 0;

    resize$: BehaviorSubject<{ width: number; height: number }>;

    radius$: Observable<number> = of(150);
    radius = window.innerHeight * 0.06 * 1.5;
    innerStroke$: Observable<number> = of(5);
    innerStroke = window.innerHeight * 0.005 * 1.5;
    outerStroke$: Observable<number> = of(16);
    outerStroke = window.innerHeight * 0.025 * 1.5;

    @HostListener('window:resize', ['$event.target'])
    onResize(target: any): void {
        this.resize$.next({
            width: target.innerWidth,
            height: target.innerHeight,
        });
    }

    ngOnChanges(): void {
        if (this.players && this.finishes) {
            const playersIn = this.players.length - this.finishes.length;
            this.text = `${playersIn}/${this.players.length}`;
            this.percentageIn = (playersIn / this.players.length) * 100;

            this.initResizeListener();
            this.initRadius();
            this.initInnerStroke();
            this.initOuterStroke();

        }
    }

    private initResizeListener(): void {
        this.resize$ = new BehaviorSubject<{ width: number; height: number }>({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }

    private initRadius(): void {
        this.radius$ = this.resize$.pipe(
            debounceTime(150),
            map((size) => size.height * 0.1 * 1.5)
        );
    }

    private initInnerStroke(): void {
        this.innerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.005 * 1.5)
        );
    }

    private initOuterStroke(): void {
        this.outerStroke$ = this.resize$.pipe(
            debounceTime(100),
            map((size) => size.height * 0.025 * 1.5)
        );
    }

}
