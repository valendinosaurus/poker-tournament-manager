import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, Subscription, timer } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';

@Directive({
  selector: '[counter]',
})
export class CounterDirective implements OnChanges, OnDestroy {
  private _counterSource$ = new Subject<any>();
  private _subscription = Subscription.EMPTY;

  @Input() counter: number = 0;
  @Input() interval: number = 0;
  @Output() value = new EventEmitter<number>();

  constructor() {
    this._subscription = this._counterSource$
      .pipe(
        switchMap(({ interval, count }) =>
          timer(0, interval).pipe(
            take(count),
            tap(() => this.value.emit(--count))
          )
        )
      )
      .subscribe();
  }

  ngOnChanges() {
    this._counterSource$.next({ count: this.counter, interval: this.interval });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }
}
