import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Elimination } from '../../../shared/models/elimination.interface';
import { ServerResponse } from '../../../shared/models/server-response';

@Injectable({
    providedIn: 'root'
})
export class EliminationApiService {

    private readonly ENDPOINT = 'elimination';

    constructor(
        private http: HttpClient
    ) {
    }

    getAll$(): Observable<Elimination[]> {
        return this.http.get<Elimination[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    get$(id: number): Observable<Elimination> {
        return this.http.get<Elimination>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    getInTournament$(tId: number): Observable<Elimination[]> {
        return this.http.get<Elimination[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}`);
    }

    getInSeries$(sId: number): Observable<Elimination[]> {
        return this.http.get<Elimination[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}`);
    }

    post$(elimination: Elimination): Observable<ServerResponse> {
        //   console
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(elimination)
        );
    }

    put$(elimination: Elimination): Observable<ServerResponse> {
        return this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(elimination)
        );
    }

    delete$(tId: number, pId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/${pId}`);
    }

    deleteByEId$(eId: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}-e-id/${eId}`);
    }

}
