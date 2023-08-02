import { AfterViewInit, Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { BlindLevel } from '../../../../shared/models/blind-level.interface';
import { interval } from 'rxjs';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-blind-level-overview',
    templateUrl: './blind-level-overview.component.html',
    styleUrls: ['./blind-level-overview.component.scss']
})
export class BlindLevelOverviewComponent implements OnChanges, AfterViewInit {

    @Input() levels: BlindLevel[];
    @Input() currentLevelIndex: number;
    @Input() isSimpleTournament: boolean;

    @Output() addBlind = new EventEmitter<void>();

    private destroyRef: DestroyRef = inject(DestroyRef);

    levelsToShow: BlindLevel[];

    ngOnChanges(): void {
        if (this.levels) {
            this.levelsToShow = this.levels;
        }
    }

    ngAfterViewInit(): void {
        let scrollDown = false;

        interval(300000).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                if (scrollDown) {
                    document.getElementById('bottom')?.scrollIntoView({behavior: 'smooth'});
                } else {
                    document.getElementById('top')?.scrollIntoView({behavior: 'smooth'});
                }

                scrollDown = !scrollDown;
            })
        ).subscribe();
    }

    protected readonly indexedDB = indexedDB;
}
