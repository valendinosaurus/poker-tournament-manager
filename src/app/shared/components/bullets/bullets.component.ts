import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-bullets',
    templateUrl: './bullets.component.html',
    styleUrls: ['./bullets.component.scss']
})
export class BulletsComponent implements OnChanges {

    @Input() number: number;

    numberArray: any[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        this.numberArray = new Array(this.number);
    }
}
