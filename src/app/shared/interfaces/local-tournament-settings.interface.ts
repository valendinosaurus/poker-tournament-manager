import { Signal, WritableSignal } from '@angular/core';

export interface LocalTournamentSettings {
    id: number;
    payout: number;
    name: string;
}

export interface LocalTournamentSettingsModel {
    id: WritableSignal<number>;
    payout: WritableSignal<number>;
    name: WritableSignal<string>;
    isValid: Signal<boolean>;
}
