import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Entry } from '../../../shared/interfaces/entry.interface';
import { ServerResponse } from '../../../shared/interfaces/server-response';

@Injectable({
    providedIn: 'root'
})
export class EntryApiService {

    private readonly ENDPOINT = 'entry';

    private http: HttpClient = inject(HttpClient);

    get$(id: number): Observable<Entry> {
        return this.http.get<Entry>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    post$(entry: Entry): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(entry)
        );
    }

    put$(entry: Entry): Observable<ServerResponse> {
        return this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(entry)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
