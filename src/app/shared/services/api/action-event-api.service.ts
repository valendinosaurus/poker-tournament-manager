import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../interfaces/server-response';
import { ActionEvent } from '../../interfaces/action-event.interface';
import { catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from '../notification.service';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class ActionEventApiService {

    private readonly ENDPOINT = 'event';
    private notificationService: NotificationService = inject(NotificationService);
    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    private isEnabled = false;

    getAll$(tId: number, clientId: number): Observable<ActionEvent[]> {
        return this.isEnabled
            ? this.authUtilService.getSub$().pipe(
                switchMap((sub: string) => this.http.get<ActionEvent[]>(
                    `${BACKEND_URL}${this.ENDPOINT}/${tId}/${clientId}/${sub}`
                ))
            )
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
