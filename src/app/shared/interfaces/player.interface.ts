export interface Player {
    id: number;
    name: string;
    image: string;
    email?: string | null;
    locked: boolean;
}

export interface PlayerInSeries extends Player {
    tId: number;
    disqualified: boolean;
}

export interface PlayerModel extends Omit<Player, 'id' | 'email'> {
    id: number | undefined;
}
