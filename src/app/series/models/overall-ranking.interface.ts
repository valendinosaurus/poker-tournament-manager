export interface LeaderboardRow {
    playerId: number;
    image: string;
    name: string;
    rank: number;
    price: number;
    points: number;
    rebuysAddons: number;
    tournaments: number;
    eliminations: number;
    itm: number;
    isTemp: boolean;
    email: string | undefined | null;
    disqualified: boolean;
}
