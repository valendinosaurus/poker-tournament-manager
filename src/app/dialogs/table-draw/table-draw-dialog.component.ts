import { Component, inject, OnInit, WritableSignal } from '@angular/core';
import { TableDraw } from '../../shared/models/table-draw.interface';
import { Player } from '../../shared/models/player.interface';
import { MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../shared/models/tournament.interface';
import { TableDrawService } from '../../core/services/table-draw.service';
import { LocalStorageService } from '../../core/services/util/local-storage.service';
import { TableDrawState } from '../../shared/enums/table-draw-state.enum';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TableDrawStateComponent } from '../../shared/components/table-draw-state/table-draw-state.component';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { TimerStateService } from '../../timer/services/timer-state.service';

@Component({
    selector: 'app-table-draw-dialog',
    templateUrl: './table-draw-dialog.component.html',
    styleUrls: ['./table-draw-dialog.component.scss'],
    standalone: true,
    imports: [NgIf, MatButtonModule, TableDrawStateComponent, NgFor, MatFormFieldModule, MatInputModule, FormsModule, MatSelectModule, MatOptionModule]
})
export class TableDrawDialogComponent implements OnInit {

    tournament: WritableSignal<Tournament>;

    tableDraw: TableDraw;
    maxPlayersPerTable = 9;
    testPlayers: Player[];
    readonly TABLE_DRAW_STATE = TableDrawState;

    private dialogRef: MatDialogRef<TableDrawDialogComponent> = inject(MatDialogRef<TableDrawDialogComponent>);
    private tableDrawService: TableDrawService = inject(TableDrawService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private state: TimerStateService = inject(TimerStateService);

    ngOnInit() {
        this.tournament = this.state.tournament;

        const draw: TableDraw | undefined = this.localStorageService.getTableDraw(this.tournament().id);

        this.testPlayers = [...this.tournament().players];

        if (draw) {
            this.tableDraw = draw;
            draw.tournament.finishes = [...this.tournament().finishes];
            this.loadExistingDrawAndCheck(draw);
        } else {
            // this.availablePlayers = [...this.tournament().players];
            this.setupEmptyTables();
        }
    }

    loadExistingDrawAndCheck(localDraw: TableDraw): void {
        this.tableDraw = this.tableDrawService.loadExistingDrawAndCheck(localDraw);
    }

    setupEmptyTables(): void {
        this.tableDraw = this.tableDrawService.setupEmptyTables(this.tournament(), this.maxPlayersPerTable);
    }

    confirmSetup(): void {
        this.tableDraw.state = TableDrawState.SET_UP;
        this.localStorageService.saveTableDraw(this.tableDraw);
    }

    addFixedSeat(table: number, seat: number, player: Player): void {
        this.tableDraw.availablePlayers = this.tableDrawService.addFixedSeat(
            table, seat, player, this.tableDraw
        );
    }

    reset(): void {
        this.tableDrawService.resetTableDraw(this.tournament().id);
        this.tableDraw.tables = [];
        this.tableDraw.state = TableDrawState.BLANK;
        this.tableDraw.tableHasToBeEliminated = false;
        this.tableDraw.playerHasToBeMoved = false;
        this.tableDraw.playersToMove = undefined;
        // SAVE ?
    }

    draw(): void {
        this.tableDraw.state = TableDrawState.DRAWN;
        this.tableDraw = this.tableDrawService.drawPlayers(this.tableDraw);
    }

    movePlayer(): void {
        this.tableDraw = this.tableDrawService.movePlayer(this.tableDraw);
    }

    eliminateTable(): void {
        this.tableDraw = this.tableDrawService.eliminateTable(this.tableDraw);
    }

    playerMoved(): void {
        this.tableDraw.playersToMove = undefined;
        this.localStorageService.saveTableDraw(this.tableDraw);
    }

}
