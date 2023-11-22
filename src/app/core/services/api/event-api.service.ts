import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../../shared/models/server-response';
import { ActionEvent } from '../../../shared/models/event.interface';

@Injectable({
    providedIn: 'root'
})
export class EventApiService {

    private readonly ENDPOINT = 'event';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(tId: number, randomId: number, sub: string): Observable<ActionEvent[]> {
        return this.http.get<ActionEvent[]>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/${randomId}/${sub}`);
    }

    post$(event: ActionEvent): Observable<ServerResponse> {
        console.log('*** LIVE *** : sending event now');
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(event)
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
