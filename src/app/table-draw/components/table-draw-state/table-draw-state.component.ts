import { Component, input } from '@angular/core';
import { TableDrawStep } from '../../enums/table-draw-step.enum';

@Component({
    selector: 'app-table-draw-state',
    templateUrl: './table-draw-state.component.html',
    styleUrls: ['./table-draw-state.component.scss'],
    standalone: true
})
export class TableDrawStateComponent {

    currentState = input.required<TableDrawStep>();

    readonly TABLE_DRAW_STEP = TableDrawStep;

}
