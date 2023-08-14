import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Finish } from '../../../shared/models/finish.interface';

@Injectable({
    providedIn: 'root'
})
export class FinishApiService {

    private readonly ENDPOINT = 'finish';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Finish[]> {
        return this.http.get<Finish[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Finish> {
        return this.http.get<Finish>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getInTournament$(tId: number): Observable<Finish[]> {
        return this.http.get<Finish[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}`);
    }

    getInSeries$(sId: number): Observable<Finish[]> {
        return this.http.get<Finish[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}`);
    }

    post$(player: Finish): Observable<any> {
        return this.http.post<any>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(player)
        );
    }

    put$(player: Finish): Observable<any> {
        return this.http.put<any>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(player)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
