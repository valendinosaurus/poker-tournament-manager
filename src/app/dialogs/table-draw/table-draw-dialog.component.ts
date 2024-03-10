import { Component, inject, OnInit } from '@angular/core';
import { TableDraw } from '../../shared/models/table-draw.interface';
import { Player } from '../../shared/models/player.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tournament } from '../../shared/models/tournament.interface';
import { TableDrawService } from '../../core/services/table-draw.service';
import { LocalStorageService } from '../../core/services/util/local-storage.service';
import { TableDrawState } from '../../shared/enums/table-draw-state.enum';

@Component({
    selector: 'app-table-draw-dialog',
    templateUrl: './table-draw-dialog.component.html',
    styleUrls: ['./table-draw-dialog.component.scss']
})
export class TableDrawDialogComponent implements OnInit {

    data: {
        tournament: Tournament
    } = inject(MAT_DIALOG_DATA);

    tableDraw: TableDraw;
    maxPlayersPerTable = 9;
    testPlayers: Player[];
    readonly TABLE_DRAW_STATE = TableDrawState;

    private dialogRef: MatDialogRef<TableDrawDialogComponent> = inject(MatDialogRef<TableDrawDialogComponent>);
    private tableDrawService: TableDrawService = inject(TableDrawService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    ngOnInit() {
        const draw: TableDraw | undefined = this.localStorageService.getTableDraw(this.data.tournament.id);

        this.testPlayers = [...this.data.tournament.players];

        if (draw) {
            this.tableDraw = draw;
            draw.tournament.finishes = [...this.data.tournament.finishes];
            this.loadExistingDrawAndCheck(draw);
        } else {
            // this.availablePlayers = [...this.data.tournament.players];
            this.setupEmptyTables();
        }
    }

    loadExistingDrawAndCheck(localDraw: TableDraw): void {
        this.tableDraw = this.tableDrawService.loadExistingDrawAndCheck(localDraw);
    }

    setupEmptyTables(): void {
        this.tableDraw = this.tableDrawService.setupEmptyTables(this.data.tournament, this.maxPlayersPerTable);
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
        this.tableDrawService.resetTableDraw(this.data.tournament.id);
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
