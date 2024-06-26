import { Component, computed, EventEmitter, inject, input, model, Output } from '@angular/core';
import { BlindLevel } from '../../interfaces/blind-level.interface';
import { DecimalPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { TimePipe } from '../../pipes/time.pipe';
import {
    BlindStructureEstimatedDurationComponent
} from './blind-structure-estimated-duration/blind-structure-estimated-duration.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { BlindStructureApiService } from '../../services/api/blind-structure-api.service';
import { FetchService } from '../../services/fetch.service';
import { MatButtonModule } from '@angular/material/button';

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
        CdkDrag,
        MatButtonModule
    ]
})
export class BlindStructureViewComponent {

    structure = model.required<BlindLevel[]>();
    locked = input<boolean>(false);
    estimationVisible = input<boolean>(true);

    blindPositions = computed(() => this.structure().map(e => e.position));

    private blindStructureApiService: BlindStructureApiService = inject(BlindStructureApiService);
    private fetchService: FetchService = inject(FetchService);

    @Output() addPause = new EventEmitter<number>();
    @Output() deleteBlind = new EventEmitter<number>();
    @Output() update = new EventEmitter<BlindLevel[]>();

    drop(event: CdkDragDrop<BlindLevel[]>) {
        moveItemInArray(this.structure(), event.previousIndex, event.currentIndex);
        this.updateWithPositions();
    }

    sort(event: Event): void {
        event.preventDefault();

        this.structure.update((structure: BlindLevel[]) => {
            const blinds = structure.filter(b => !b.isPause);
            const pauses = structure.filter(b => b.isPause);
            const pauseIndexes: number[] = [];

            pauses.forEach(pause => {
                pauseIndexes.push(structure.indexOf(pause));
            });

            const sortedBlinds = blinds.sort((a: BlindLevel, b: BlindLevel) => +a.bb - +b.bb);

            pauseIndexes.forEach((index, i) => {
                sortedBlinds.splice(index, 0, pauses[i]);
            });

            return sortedBlinds;
        });

        this.updateWithPositions();
    }

    private updateWithPositions(): void {
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

        this.update.emit(this.structure());
    }

}
