import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BlindLevel } from '../../models/blind-level.interface';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';

@Component({
    selector: 'app-blind-structure-view',
    templateUrl: './blind-structure-view.component.html',
    styleUrls: ['./blind-structure-view.component.scss'],
    standalone: true,
    imports: [
        DecimalPipe,
        NgFor,
        NgIf
    ]
})
export class BlindStructureViewComponent implements OnChanges {

    @Input({required: true}) structure: BlindLevel[];
    @Input() locked = false;

    blindPositions: number[];

    @Output() addPause = new EventEmitter<number>();
    @Output() deleteBlind = new EventEmitter<number>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['structure']?.currentValue !== undefined) {
            this.blindPositions = this.structure.map(e => e.position);
        }
    }

}
