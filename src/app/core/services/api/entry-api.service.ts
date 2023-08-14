import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Entry } from '../../../shared/models/entry.interface';

@Injectable({
    providedIn: 'root'
})
export class EntryApiService {

    private readonly ENDPOINT = 'entry';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Entry[]> {
        return this.http.get<Entry[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Entry> {
        return this.http.get<Entry>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getInTournament$(tId: number): Observable<Entry[]> {
        return this.http.get<Entry[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}`);
    }

    getInSeries$(sId: number): Observable<Entry[]> {
        return this.http.get<Entry[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}`);
    }

    post$(entry: Entry): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(entry)
        );
    }

    put$(entry: Entry): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(entry)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
