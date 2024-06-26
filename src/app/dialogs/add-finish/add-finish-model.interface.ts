import { Signal, WritableSignal } from '@angular/core';

export interface AddFinishModel {
    playerId: WritableSignal<number | undefined>;
    eliminatedBy: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
