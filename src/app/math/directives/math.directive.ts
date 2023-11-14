import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { MathContent } from '../../shared/models/math-content.interface';
import { take, takeUntil } from 'rxjs/operators';
import { MathService } from '../../core/math.service';

@Directive({
    selector: '[appMath]'
})
export class MathDirective implements OnInit, OnChanges, OnDestroy {
    private alive$ = new Subject<boolean>();

    @Input() appMath: MathContent;
    private readonly _el: HTMLElement;

    constructor(
        private service: MathService,
        private el: ElementRef
    ) {
        this._el = el.nativeElement as HTMLElement;
    }

    ngOnInit(): void {
        this.service
            .ready()
            .pipe(
                take(1),
                takeUntil(this.alive$)
            ).subscribe(res => {
            this.service.render(this._el, this.appMath);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes);
    }

    ngOnDestroy(): void {
        this.alive$.next(false);
    }
}
