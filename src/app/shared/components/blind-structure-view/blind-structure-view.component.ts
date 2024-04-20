import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { BlindLevel } from '../../models/blind-level.interface';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TimePipe } from '../../pipes/time.pipe';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-blind-structure-view',
    templateUrl: './blind-structure-view.component.html',
    styleUrls: ['./blind-structure-view.component.scss'],
    standalone: true,
    imports: [
        DecimalPipe,
        NgFor,
        NgIf,
        TimePipe,
        FormsModule
    ]
})
export class BlindStructureViewComponent implements OnChanges {

    @Input({required: true}) structure: BlindLevel[];
    @Input() locked = false;
    @Input() estimationVisible = true;

    noOfPlayers = 10;
    startStack = 10000;
    noOfRebuys = 0;
    rebuyStack = 10000;
    noOfAddons = 0;
    addonStack = 15000;

    blindPositions: number[];
    estimatedDurationInMinutes = 0;

    isExpanded = false;

    @Output() addPause = new EventEmitter<number>();
    @Output() deleteBlind = new EventEmitter<number>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['structure']?.currentValue !== undefined) {
            this.blindPositions = this.structure.map(e => e.position);
            this.calculateDuration();
        }
    }

    calculateDuration(): void {
        if (this.structure.length > 0) {
            const totalChips = (this.noOfPlayers * this.startStack)
                + (this.noOfRebuys * this.rebuyStack)
                + (this.noOfAddons * this.addonStack);

            const blindLevel100BB = totalChips / 100;
            const closestLevel = this.structure.reduce(
                (prev: BlindLevel, curr: BlindLevel) =>
                    Math.abs(curr.bb - blindLevel100BB) < Math.abs(prev.bb - blindLevel100BB) ? curr : prev
            );

            let timeToClosestLevel = 0;

            for (let level of this.structure) {
                timeToClosestLevel += level.duration;

                if (level.id === closestLevel.id) {
                    break;
                }
            }

            this.estimatedDurationInMinutes = timeToClosestLevel;
        }
    }

}
