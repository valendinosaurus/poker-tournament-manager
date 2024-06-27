import { Signal, WritableSignal } from '@angular/core';

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

export interface BlindLevelModel {
    id: WritableSignal<number | undefined>;
    sb: WritableSignal<number>;
    bb: WritableSignal<number>;
    ante: WritableSignal<number>;
    btnAnte: WritableSignal<number>;
    duration: WritableSignal<number>;
    isPause: WritableSignal<boolean>;
    isChipUp: WritableSignal<boolean>;
    endsRebuy: WritableSignal<boolean>;
    isValid: Signal<boolean>;
}

