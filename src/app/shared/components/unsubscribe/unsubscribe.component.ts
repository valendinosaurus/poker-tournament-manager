import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-unsubscribe',
    template: '',
    styleUrls: []
})
export class UnsubscribeComponent implements OnDestroy {

    private destroy$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}
