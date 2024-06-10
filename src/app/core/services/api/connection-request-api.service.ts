import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponse } from '../../../shared/interfaces/server-response';
import { ConnectionRequest } from '../../../shared/interfaces/util/connection-request.interface';
import { filter, switchMap } from 'rxjs/operators';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class ConnectionRequestApiService {

    private readonly ENDPOINT = 'connection-request';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAllByEmail$(): Observable<ConnectionRequest[]> {
        return this.authUtilService.getEmail$().pipe(
            filter((email: string | undefined): email is string => email !== undefined),
            switchMap((email: string) => this.http.get<ConnectionRequest[]>(`${BACKEND_URL}${this.ENDPOINT}/all/${email}`)
            )
        );
    }

    get$(id: number): Observable<ConnectionRequest> {
        return this.http.get<ConnectionRequest>(`${BACKEND_URL}${this.ENDPOINT}/${id}}`);
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
