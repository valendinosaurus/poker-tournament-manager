import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { BlindLevel } from '../../../shared/models/blind-level.interface';

@Injectable({
    providedIn: 'root'
})
export class BlindLevelApiService {

    private readonly ENDPOINT = 'blind-level';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<BlindLevel[]> {
        return this.http.get<BlindLevel[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<BlindLevel> {
        return this.http.get<BlindLevel>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getOfTournament$(tId: number): Observable<BlindLevel[]> {
        return this.http.get<BlindLevel[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}`);
    }

    post$(blindLevel: BlindLevel): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(blindLevel)
        );
    }

    put$(blindLevel: BlindLevel): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(blindLevel)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
