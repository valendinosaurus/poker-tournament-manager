import { Injectable } from '@angular/core';

export interface LocalSettings {
    autoSlide: boolean;
    showCondensedBlinds: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    getLocalSettings(): LocalSettings {
        const settingsFromLocalStorage = localStorage.getItem('LOCAL_SETTINGS');

        if (settingsFromLocalStorage) {
            return JSON.parse(settingsFromLocalStorage);
        } else {
            return {
                autoSlide: true,
                showCondensedBlinds: false
            };
        }
    }

}
