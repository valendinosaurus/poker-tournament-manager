import { Signal, WritableSignal } from '@angular/core';

export interface AddAddonModel {
    playerId: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
