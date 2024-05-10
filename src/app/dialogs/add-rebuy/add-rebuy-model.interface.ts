import { Signal, WritableSignal } from '@angular/core';

export interface AddRebuyModel {
    playerId: WritableSignal<number | undefined>;
    eliminatedBy: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
