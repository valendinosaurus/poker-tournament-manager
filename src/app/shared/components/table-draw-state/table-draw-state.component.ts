import { Component, Input } from '@angular/core';
import { TableDrawState } from '../../enums/table-draw-state.enum';

@Component({
    selector: 'app-table-draw-state',
    templateUrl: './table-draw-state.component.html',
    styleUrls: ['./table-draw-state.component.scss']
})
export class TableDrawStateComponent {

    @Input() currentState: TableDrawState;

    readonly TABLE_DRAW_STATE = TableDrawState;

}
