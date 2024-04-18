import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
    selector: 'app-bullets',
    templateUrl: './bullets.component.html',
    styleUrls: ['./bullets.component.scss'],
    standalone: true,
    imports: [NgFor]
})
export class BulletsComponent implements OnChanges {

    @Input() number: number;
    @Input() bulletClass = 'fa-circle';

    numberArray: any[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        this.numberArray = new Array(this.number);
    }
}
