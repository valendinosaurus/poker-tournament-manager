import { Injectable } from '@angular/core';
import * as Notiflix from 'notiflix';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor() {
        Notiflix.Notify.init({
            fontSize: '12px',
            timeout: 5000,
            fontAwesomeIconSize: '8px',
        });
    }

    success(message: string): void {
        Notiflix.Notify.success(message);
    }

    warning(message: string): void {
        Notiflix.Notify.warning(message);
    }

    error(message: string): void {
        Notiflix.Notify.failure(message);
    }

    info(message: string): void {
        Notiflix.Notify.info(message);
    }
}
