import { Component, computed, EventEmitter, input, Input, Output, signal } from '@angular/core';
import { BlindLevel } from '../../interfaces/blind-level.interface';
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
export class BlindStructureViewComponent {

    structure = input.required<BlindLevel[]>();
    //   @Input({required: true}) structure: BlindLevel[];
    @Input() locked = false;
    @Input() estimationVisible = true;

    noOfPlayers = signal(10);
    startStack = signal(10000);
    noOfRebuys = signal(0);
    rebuyStack = signal(10000);
    noOfAddons = signal(0);
    addonStack = signal(15000);

    blindPositions = computed(() => this.structure().map(e => e.position));

    totalChips = computed(() => (this.noOfPlayers() * this.startStack())
        + (this.noOfRebuys() * this.rebuyStack())
        + (this.noOfAddons() * this.addonStack()));

    blindLevel100BB = computed(() => this.totalChips() / 100);

    closestLevel = computed(() => this.structure().reduce(
            (prev: BlindLevel, curr: BlindLevel) =>
                Math.abs(curr.bb - this.blindLevel100BB()) < Math.abs(prev.bb - this.blindLevel100BB()) ? curr : prev
        )
    )

    estimatedDurationInMinutes = computed(() => {
        if (this.structure().length > 0) {
            let timeToClosestLevel = 0;

            for (let level of this.structure()) {
                timeToClosestLevel += level.duration;

                if (level.id === this.closestLevel().id) {
                    break;
                }
            }

            return timeToClosestLevel;
        }

        return 0;
    });

    isExpanded = false;

    @Output() addPause = new EventEmitter<number>();
    @Output() deleteBlind = new EventEmitter<number>();

}
