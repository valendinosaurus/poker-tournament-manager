export interface SeriesTournamentRow {
    playerId: number;
    image: string;
    name: string;
    rank: number;
    price: number;
    rebuys: number;
    addons: number;
    reEntries: number;
    points: number;
    dealMade: boolean;
    isTemp: boolean;
    email: string | undefined | null;
}
