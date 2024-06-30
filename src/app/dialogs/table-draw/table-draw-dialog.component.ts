import { Component, computed, inject, OnInit, WritableSignal } from '@angular/core';
import { TableDraw } from '../../shared/interfaces/table-draw.interface';
import { Player } from '../../shared/interfaces/player.interface';
import { TableDrawService } from '../../shared/services/table-draw.service';
import { TableDrawState } from '../../shared/enums/table-draw-state.enum';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TableDrawStateComponent } from '../../shared/components/table-draw-state/table-draw-state.component';
import { MatButtonModule } from '@angular/material/button';
import { TimerStateService } from '../../timer/services/timer-state.service';

@Component({
    selector: 'app-table-draw-dialog',
    templateUrl: './table-draw-dialog.component.html',
    styleUrls: ['./table-draw-dialog.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        TableDrawStateComponent,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatSelectModule,
        MatOptionModule
    ]
})
export class TableDrawDialogComponent implements OnInit {

    tableDraw: WritableSignal<TableDraw>;
    maxPlayersPerTable = 9;
    readonly TABLE_DRAW_STATE = TableDrawState;

    private tableDrawService: TableDrawService = inject(TableDrawService);
    private state: TimerStateService = inject(TimerStateService);

    areAllPlayersAlive = computed(() =>
        this.state.tournament().players.length > 0 && this.state.tournament().finishes.length === 0
    );

    ngOnInit() {
        this.tableDrawService.update();
        this.tableDraw = this.tableDrawService.tableDraw;
    }

    setupEmptyTables(): void {
        this.tableDrawService.setupEmptyTables();
    }

    confirmSetup(): void {
        this.tableDrawService.confirmSetup();
    }

    addFixedSeat(table: number, seat: number, player: Player): void {
        this.tableDrawService.addFixedSeat(
            table, seat, player
        );
    }

    reset(): void {
        this.tableDrawService.resetTableDraw();
        // SAVE ?
    }

    draw(): void {
        this.tableDrawService.drawPlayers();
    }

    movePlayer(): void {
        this.tableDrawService.movePlayer();
    }

    eliminateTable(): void {
        this.tableDrawService.eliminateTable();
    }

    playerMoved(): void {
        this.tableDrawService.playerMoved();
    }

    changeMaxPlayers(number: number): void {
        this.tableDrawService.maxPlayersPerTable.set(number);
    }

}
