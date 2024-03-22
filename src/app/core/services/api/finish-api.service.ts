import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Finish } from '../../../shared/models/finish.interface';
import { ServerResponse } from '../../../shared/models/server-response';

@Injectable({
    providedIn: 'root'
})
export class FinishApiService {

    private readonly ENDPOINT = 'finish';
    private http: HttpClient = inject(HttpClient);

    getAll$(): Observable<Finish[]> {
        return this.http.get<Finish[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

    getInSeries$(sId: number): Observable<Finish[]> {
        return this.http.get<Finish[]>(`${BACKEND_URL}${this.ENDPOINT}/series/${sId}`);
    }

    post$(player: Finish): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(player)
        );
    }

    delete$(tId: number, pId: number): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${tId}/${pId}`);
    }

    increaseAllOfTournament$(tId: number, pIds: number[]): Observable<any> {
        return this.http.put<any>(
            `${BACKEND_URL}${this.ENDPOINT}/increase/tournament/${tId}`,
            JSON.stringify({ids: pIds})
        );
    }

    decreaseAllOfTournament$(tId: number, pIds: number[]): Observable<any> {
        return this.http.put<any>(
            `${BACKEND_URL}${this.ENDPOINT}/decrease/tournament/${tId}`,
            JSON.stringify({ids: pIds})
        );
    }
}
