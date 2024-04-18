import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../../shared/models/server-response';
import { ActionEvent } from '../../../shared/models/action-event.interface';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

@Injectable({
    providedIn: 'root'
})
export class ActionEventApiService {

    private readonly ENDPOINT = 'event';
    private notificationService: NotificationService = inject(NotificationService);
    private http: HttpClient = inject(HttpClient);

    private isEnabled = false;

    getAll$(tId: number, clientId: number, sub: string): Observable<ActionEvent[]> {
        return this.isEnabled
            ? this.http.get<ActionEvent[]>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/${clientId}/${sub}`)
            : of([]);
    }

    post$(event: ActionEvent): Observable<ServerResponse | null> {
        return this.isEnabled
            ? this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify(event)
            ).pipe(
                catchError(() => {
                    this.notificationService.error('Error sending Event');
                    return of(null);
                })
            )
            : of(null);
    }

    delete$(id: number): Observable<any> {
        return this.isEnabled
            ? this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/single/${id}`)
            : of(null);
    }

    deleteAll$(tId: number): Observable<any> {
        return this.isEnabled
            ? this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/all/${tId}`)
            : of(null);
    }
}
