import { Component, inject, OnInit, Signal } from '@angular/core';
import { TableDrawService } from '../../../../../shared/services/table-draw.service';
import { BulletsComponent } from '../../../../../shared/components/bullets/bullets.component';
import { DecimalPipe } from '@angular/common';
import { FormulaPointsPipe } from '../../../../../shared/pipes/formula-points.pipe';
import { UserWithImageComponent } from '../../../../../shared/components/user-with-image/user-with-image.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { TableDraw } from '../../../../../shared/interfaces/table-draw.interface';

@Component({
    selector: 'app-tables',
    templateUrl: './tables.component.html',
    styleUrl: './tables.component.scss',
    standalone: true,
    imports: [
        BulletsComponent,
        DecimalPipe,
        FormulaPointsPipe,
        UserWithImageComponent,
        MatFormFieldModule,
        MatOptionModule,
        MatSelectModule
    ],
})
export class TablesComponent implements OnInit {

    tableDraw: Signal<TableDraw>;

    private tableDrawService: TableDrawService = inject(TableDrawService);

    ngOnInit(): void {
        this.tableDraw = this.tableDrawService.tableDraw;
    }

}
