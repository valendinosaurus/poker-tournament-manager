import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { BlindLevel } from '../../../shared/models/blind-level.interface';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, switchMap } from 'rxjs/operators';
import { BlindLevelModel } from '../../../shared/models/blind-level-model.interface';
import { ServerResponse } from '../../../shared/models/server-response';

@Injectable({
    providedIn: 'root'
})
export class BlindLevelApiService {

    private readonly ENDPOINT = 'blind-level';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAll$(sub: string): Observable<BlindLevel[]> {
        return this.http.get<BlindLevel[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`);
    }

    get$(id: number, sub: string): Observable<BlindLevel> {
        return this.http.get<BlindLevel>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    getOfTournament$(tId: number, sub: string): Observable<BlindLevel[]> {
        return this.http.get<BlindLevel[]>(`${BACKEND_URL}${this.ENDPOINT}/tournament/${tId}/${sub}`);
    }

    post$(blindLevel: BlindLevelModel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.post<ServerResponse>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindLevel,
                    sub
                })
            ))
        );
    }

    put$(blindLevel: BlindLevel): Observable<ServerResponse> {
        return this.authService.user$.pipe(
            map((user: User | undefined | null) => user?.sub ?? ''),
            switchMap((sub: string) => this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindLevel,
                    sub
                })
            ))
        );
    }

    delete$(id: number, sub: string): Observable<any> {
        return this.http.delete<any>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }
}
