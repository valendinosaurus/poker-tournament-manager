import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { AuthService, User } from '@auth0/auth0-angular';
import { ServerResponse } from '../../../shared/models/server-response';
import { ConnectionRequest } from '../../../shared/models/connection-request.interface';
import { filter, map, switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ConnectionRequestApiService {

    private readonly ENDPOINT = 'connection-request';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
    }

    getAllByEmail$(): Observable<ConnectionRequest[]> {
        return this.authService.user$.pipe(
            filter((user: User | undefined | null): user is User => user !== undefined && user !== null),
            map((user: User) => user.email),
            filter((email: string | undefined): email is string => email !== undefined),
            switchMap((email: string) => this.http.get<ConnectionRequest[]>(`${BACKEND_URL}${this.ENDPOINT}/all/${email}`)
            )
        );
    }

    get$(id: number, sub: string): Observable<ConnectionRequest> {
        return this.http.get<ConnectionRequest>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`);
    }

    post$(request: ConnectionRequest): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(request)
        );
    }

    put$(request: ConnectionRequest): Observable<ServerResponse> {
        return this.http.put<ServerResponse>(`${BACKEND_URL}${this.ENDPOINT}`,
            JSON.stringify(request)
        );
    }

    delete$(id: number): Observable<any> {
        return this.http.delete(`${BACKEND_URL}${this.ENDPOINT}/${id}`);
    }
}
