import { Player } from './player.interface';
import { TableDrawSeat } from './table-draw-seat.interface';
import { Tournament } from './tournament.interface';
import { TableDrawState } from '../enums/table-draw-state.enum';

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
