import { Component, computed, EventEmitter, input, model, Output } from '@angular/core';
import { BlindLevel } from '../../interfaces/blind-level.interface';
import { DecimalPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { TimePipe } from '../../pipes/time.pipe';
import {
    BlindStructureEstimatedDurationComponent
} from './blind-structure-estimated-duration/blind-structure-estimated-duration.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

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
        BlindStructureEstimatedDurationComponent,
        JsonPipe,
        CdkDropList,
        CdkDrag
    ]
})
export class BlindStructureViewComponent {

    structure = model.required<BlindLevel[]>();
    locked = input<boolean>(false);
    estimationVisible = input<boolean>(true);

    blindPositions = computed(() => this.structure().map(e => e.position));

    @Output() addPause = new EventEmitter<number>();
    @Output() deleteBlind = new EventEmitter<number>();

    drop(event: CdkDragDrop<BlindLevel[]>) {
        moveItemInArray(this.structure(), event.previousIndex, event.currentIndex);

        let pos = 0;

        this.structure.update((structure: BlindLevel[]) =>
            structure.map(
                (level: BlindLevel, index: number, original: BlindLevel[]) => {
                    if (level.isPause || (index > 0 && original[index - 1].isPause)) {
                        pos++;
                    } else {
                        pos += 2;
                    }

                    return {
                        ...level,
                        position: pos
                    };
                }
            )
        );

        // TODO save
    }

}
