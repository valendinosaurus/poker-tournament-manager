import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { Finish } from '../../interfaces/finish.interface';
import { ServerResponse } from '../../interfaces/server-response';

@Injectable({
    providedIn: 'root'
})
export class FinishApiService {

    private readonly ENDPOINT = 'finish';
    private http: HttpClient = inject(HttpClient);

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
            JSON.stringify({ids: pIds, id: tId})
        );
    }

    decreaseAllOfTournament$(tId: number, pIds: number[]): Observable<any> {
        return this.http.put<any>(
            `${BACKEND_URL}${this.ENDPOINT}/decrease/tournament/${tId}`,
            JSON.stringify({ids: pIds, id: tId})
        );
    }
}
