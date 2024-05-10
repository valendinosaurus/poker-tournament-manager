import { Signal, WritableSignal } from '@angular/core';

export interface AddPlayerModel {
    playerId: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
