import { Signal, WritableSignal } from '@angular/core';

export interface AddBlindsModel {
    blindIds: WritableSignal<number[] | undefined>;
    parentId: WritableSignal<number>;
    isValid: Signal<boolean>;
}
