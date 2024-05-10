import { Signal, WritableSignal } from '@angular/core';

export interface AddPlayerMultiModel {
    playerIds: WritableSignal<number[]>;
    isValid: Signal<boolean>;
}
