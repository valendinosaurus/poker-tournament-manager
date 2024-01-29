import { Player } from './player.interface';
import { TableDrawSeat } from './table-draw-seat.interface';
import { TableDrawState } from '../../test/draw/test-draw-page/test-draw-page.component';
import { Tournament } from './tournament.interface';

export interface TableDraw {
    state: TableDrawState;
    tables: TableDrawSeat[][];
    tournament: Tournament;
    noOfTables: number;
    maxPlayersPerTable: number;

    availablePlayers: Player[];

    playersToMove: TableDrawSeat[] | undefined;
    tableIndexToTake: number;
    tableIndexToAdd: number;
    noOfPlayersToMove: number;
    playerHasToBeMoved: boolean;
    tableHasToBeEliminated: boolean;
}
