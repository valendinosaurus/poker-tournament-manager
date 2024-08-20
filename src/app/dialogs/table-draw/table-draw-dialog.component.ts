import { Component } from '@angular/core';
import { TableDrawComponent } from '../../table-draw/components/table-draw/table-draw.component';

@Component({
    selector: 'app-table-draw-dialog',
    templateUrl: './table-draw-dialog.component.html',
    styleUrls: ['./table-draw-dialog.component.scss'],
    standalone: true,
    imports: [
        TableDrawComponent
    ]
})
export class TableDrawDialogComponent {

}
