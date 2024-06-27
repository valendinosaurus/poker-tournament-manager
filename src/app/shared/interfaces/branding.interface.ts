import { Signal, WritableSignal } from '@angular/core';

export interface Branding {
    id: number;
    name: string;
    description: string;
    logo: string;
    locked: boolean;
}

export interface BrandingModel {
    id: WritableSignal<number | undefined>;
    name: WritableSignal<string>;
    description: WritableSignal<string>;
    logo: WritableSignal<string>;
    locked: WritableSignal<boolean>;
    isValid: Signal<boolean>;
}
