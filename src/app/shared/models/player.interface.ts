export interface Player {
    id: number;
    name: string;
    image: string;
    email?: string | null;
}

export interface PlayerInSeries extends Player {
    tId: number;
}

export interface PlayerModel extends Omit<Player, 'id' | 'email'> {
    id: number | undefined;
}
