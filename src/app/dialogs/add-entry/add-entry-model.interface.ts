import { Signal, WritableSignal } from '@angular/core';

export interface AddEntryModel {
    playerId: WritableSignal<number | undefined>;
    isValid: Signal<boolean>;
}
