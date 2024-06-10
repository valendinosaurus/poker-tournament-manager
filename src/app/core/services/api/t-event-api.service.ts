import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../../shared/models/server-response';
import { TEventType } from '../../../shared/enums/t-event-type.enum';
import { map } from 'rxjs/operators';
import { TEvent } from '../../../shared/models/t-event.interface';

@Injectable({
    providedIn: 'root'
})
export class TEventApiService {

    private readonly ENDPOINT = 't-event';

    private http: HttpClient = inject(HttpClient);

    getAll$(tId: number): Observable<TEvent[]> {
        return this.http.get<TEvent[]>(`${BACKEND_URL}${this.ENDPOINT}/${tId}?a=${Math.random()}`).pipe(map(e => e.reverse()));
    }

    post$(tId: number, message: string, type: TEventType): Observable<ServerResponse | null> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify({
                tId,
                message: `${this.getCurrentTimeString()}: ${message}`,
                type
            })
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/single/${id}`);
    }

    deleteAll$(tId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/all/${tId}`);
    }

    private getCurrentTimeString(): string {
        return new Date().toTimeString().slice(0, 5);
    }
}
