import { Signal, WritableSignal } from '@angular/core';

export interface AddPauseModel {
    blindId: WritableSignal<number | undefined>;
    parentId: WritableSignal<number>;
    isValid: Signal<boolean>;
}
