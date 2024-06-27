import { Signal, WritableSignal } from '@angular/core';

export interface Location {
    id: number;
    name: string;
    image: string;
    locked: boolean;
}

export interface LocationModel {
    id: WritableSignal<number | undefined>;
    name: WritableSignal<string>;
    image: WritableSignal<string>;
    locked: WritableSignal<boolean>;
    isValid: Signal<boolean>;
}
