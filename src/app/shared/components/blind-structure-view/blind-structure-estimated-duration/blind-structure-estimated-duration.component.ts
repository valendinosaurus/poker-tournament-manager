import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimePipe } from '../../../pipes/time.pipe';
import { BlindLevel } from '../../../interfaces/blind-level.interface';

@Component({
    selector: 'app-blind-structure-estimated-duration',
    templateUrl: './blind-structure-estimated-duration.component.html',
    styleUrl: './blind-structure-estimated-duration.component.scss',
    standalone: true,
    imports: [
        FormsModule,
        TimePipe
    ]
})
export class BlindStructureEstimatedDurationComponent {

    structure = input.required<BlindLevel[]>();
    estimationVisible = input<boolean>(true);

    noOfPlayers = signal(10);
    startStack = signal(10000);
    noOfRebuys = signal(0);
    rebuyStack = signal(10000);
    noOfAddons = signal(0);
    addonStack = signal(15000);
    isExpanded = signal(false);

    totalChips = computed(() => (this.noOfPlayers() * this.startStack())
        + (this.noOfRebuys() * this.rebuyStack())
        + (this.noOfAddons() * this.addonStack()));

    blindLevel100BB = computed(() => this.totalChips() / 100);

    closestLevel = computed(() => this.structure().reduce(
            (prev: BlindLevel, curr: BlindLevel) =>
                Math.abs(curr.bb - this.blindLevel100BB()) < Math.abs(prev.bb - this.blindLevel100BB()) ? curr : prev
        )
    );

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

}
