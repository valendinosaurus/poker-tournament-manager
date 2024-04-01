export interface BlindLevel {
    id: number;
    sb: number;
    bb: number;
    ante: number;
    btnAnte: number;
    duration: number;
    isPause: boolean;
    isChipUp: boolean;
    endsRebuy: boolean;
    position: number;
}

export interface BlindLevelModel extends Omit<BlindLevel, 'id' | 'position'> {
    id: number | undefined;
}

