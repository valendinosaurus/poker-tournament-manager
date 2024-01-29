import { Component, inject, OnInit } from '@angular/core';
import { Tournament } from '../../../shared/models/tournament.interface';
import { dummyTourney } from '../../../shared/data/dummy-tournament.const';
import { TableDrawService } from '../../../core/services/table-draw.service';
import { LocalStorageService } from '../../../core/services/util/local-storage.service';
import { Player } from '../../../shared/models/player.interface';
import { TableDraw } from '../../../shared/models/table-draw.interface';

export enum TableDrawState {
    BLANK = 'BLANK',
    SET_UP = 'SET UP',
    DRAWN = 'DRAWN'
}

@Component({
    selector: 'app-test-draw-page',
    templateUrl: './test-draw-page.component.html',
    styleUrls: ['./test-draw-page.component.scss']
})
export class TestDrawPageComponent implements OnInit {

    tableDraw: TableDraw;
    maxPlayersPerTable = 9;
    testPlayers: Player[];
    readonly TABLE_DRAW_STATE = TableDrawState;

    dummyTournament: Tournament = {
        ...dummyTourney,
        id: 999999999,
        players: [
            {id: 0, name: 'Player 1', image: ''},
            {id: 1, name: 'Player 2', image: ''},
            {id: 2, name: 'Player 3', image: ''},
            {id: 3, name: 'Player 4', image: ''},
            {id: 4, name: 'Player 5', image: ''},
            {id: 5, name: 'Player 6', image: ''},
            {id: 6, name: 'Player 7', image: ''},
            {id: 7, name: 'Player 8', image: ''},
            {id: 8, name: 'Player 9', image: ''},
            {id: 9, name: 'Player 10', image: ''},
            {id: 10, name: 'Player 11', image: ''},
            {id: 11, name: 'Player 12', image: ''},
            {id: 12, name: 'Player 13', image: ''},
            {id: 13, name: 'Player 14', image: ''},
            {id: 14, name: 'Player 15', image: ''},
            {id: 15, name: 'Player 16', image: ''},
            {id: 16, name: 'Player 17', image: ''}
        ]
    };

    private tableDrawService: TableDrawService = inject(TableDrawService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    ngOnInit() {
        const draw: TableDraw | undefined = this.localStorageService.getTableDraw(this.dummyTournament.id);

        this.testPlayers = [...this.dummyTournament.players];

        if (draw) {
            this.tableDraw = draw;
            this.loadExistingDrawAndCheck(draw);
        } else {
            // this.availablePlayers = [...this.dummyTournament.players];
            this.setupEmptyTables();
        }
    }

    loadExistingDrawAndCheck(localDraw: TableDraw): void {
        this.tableDraw = this.tableDrawService.loadExistingDrawAndCheck(localDraw);
    }

    setupEmptyTables(): void {
        this.tableDraw = this.tableDrawService.setupEmptyTables(this.dummyTournament, this.maxPlayersPerTable);
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
        this.tableDrawService.resetTableDraw(this.dummyTournament.id);
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

    removePlayer(player: Player): void {
        this.tableDraw.playersToMove = undefined;

        this.tableDraw.tournament.finishes.push({
            playerId: player.id,
            timestamp: new Date().getDate(),
            price: 1,
            rank: 1,
            tournamentId: this.tableDraw.tournament.id
        });

        this.testPlayers = this.testPlayers.filter(p => p.id !== player.id);
        this.loadExistingDrawAndCheck(this.tableDraw);
    }

}
