import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../../shared/models/server-response';
import { ActionEvent } from '../../../shared/models/event.interface';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

@Injectable({
    providedIn: 'root'
})
export class EventApiService {

    private readonly ENDPOINT = 'event';
    private notificationService: NotificationService = inject(NotificationService);

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(tId: number, clientId: number, sub: string): Observable<ActionEvent[]> {
        return this.http.get<ActionEvent[]>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/${clientId}/${sub}`);
    }

    post$(event: ActionEvent): Observable<ServerResponse | null> {
        console.log('*** LIVE *** : sending event now');
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(event)
        ).pipe(
            catchError(() => {
                this.notificationService.error('Error sending Event');
                return of(null);
            })
        );
    }

    delete$(id: number): Observable<any> {
        console.log('*** LIVE *** : delete event', id);
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/single/${id}`);
    }

    deleteAll$(tId: number): Observable<any> {
        console.log('*** LIVE *** : deleting all');
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/all/${tId}`);
    }
}
