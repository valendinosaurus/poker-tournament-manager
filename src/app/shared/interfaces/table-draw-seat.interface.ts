import { Player } from './player.interface';

export interface TableDrawSeat {
    player: Player;
    isButton: boolean;
    table: number;
    seatNo: number;
    fixSeat: boolean;
    selectVisible: boolean;
    eliminated: boolean;
    placeholder: boolean;
}
