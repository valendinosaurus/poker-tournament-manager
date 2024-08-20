import { TableDrawSeat } from './table-draw-seat.interface';
import { TableDrawStep } from '../enums/table-draw-step.enum';
import { TableDrawTable } from './table-draw-table.interface';
import { TableDrawAction } from '../enums/table-draw-action.enum';
import { Player } from '../../shared/interfaces/player.interface';

export interface TableDraw {
    id: number;
    step: TableDrawStep;
    action: TableDrawAction;
    tables: TableDrawTable[];
    players: Player[];
    finishedPlayerIds: number[];
    noOfTables: number;
    maxPlayersPerTable: number;
    minTables: number;
    maxTables: number;
    availablePlayers: Player[];
    playersToMove: TableDrawSeat[] | undefined;
    tableIndexToTake: number;
    tableIndexToAdd: number;
    noOfPlayersToMove: number;
    newPlayers: Player[];
    events: TableDrawEvent[];
    waitingList: Player[];
}

export interface TableDrawEvent {
    time: Date;
    type: TableDrawEventType;
    message: string;
    read: boolean;
}

export enum TableDrawEventType {
    ADDED_PLAYER = 'ADDED_PLAYER',
    MOVED_PLAYER = 'MOVED_PLAYER',
    ELIMINATED_TABLE = 'ELIMINATED_TABLE',
}
