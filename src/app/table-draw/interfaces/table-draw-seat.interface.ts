import { Player } from '../../shared/interfaces/player.interface';

export interface TableDrawSeat {
    player: Player;
    isButton: boolean;
    table: number;
    seatNo: number;
    isFixedSeat: boolean;
    isSelectVisible: boolean;
    isEliminated: boolean;
    isPlaceholder: boolean;
}
