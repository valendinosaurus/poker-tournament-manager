import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Elimination } from '../../interfaces/elimination.interface';
import { ServerResponse } from '../../interfaces/server-response';

@Injectable({
    providedIn: 'root'
})
export class EliminationApiService {

    private readonly ENDPOINT = 'elimination';

    private http: HttpClient = inject(HttpClient);

    get$(id: number): Observable<Elimination> {
        return this.http.get<Elimination>(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }

    post$(elimination: Elimination): Observable<ServerResponse> {
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
