import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlindStructure, BlindStructureModel } from '../../../shared/models/blind-structure.interface';
import { BACKEND_URL } from '../../../app.const';
import { ServerResponseType } from '../../../shared/types/server-response.type';
import { switchMap } from 'rxjs/operators';
import { AuthUtilService } from '../auth-util.service';

@Injectable({
    providedIn: 'root'
})
export class BlindStructureApiService {

    private readonly ENDPOINT = 'blind-structure';

    private http: HttpClient = inject(HttpClient);
    private authUtilService: AuthUtilService = inject(AuthUtilService);

    getAll$(): Observable<BlindStructure[]> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<BlindStructure[]>(`${BACKEND_URL}${this.ENDPOINT}/${sub}`))
        );
    }

    get$(id: number): Observable<BlindStructure> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.get<BlindStructure>(`${BACKEND_URL}${this.ENDPOINT}/${id}/${sub}`))
        );
    }

    post$(blindStructure: BlindStructureModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.post<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindStructure,
                    sub
                })
            ))
        );
    }

    put$(blindStructure: BlindStructureModel): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.put<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}`,
                JSON.stringify({
                    ...blindStructure,
                    sub
                })
            ))
        );
    }

    delete$(blindStructureId: number): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<ServerResponseType>(
                `${BACKEND_URL}${this.ENDPOINT}/${blindStructureId}/${sub}`
            ))
        );
    }

    addBlinds$(blindId: number[], structureId: number, positions: number[]): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-blinds`,
            JSON.stringify({
                sId: structureId,
                blindIds: blindId,
                positions
            })
        );
    }

    addPause$(blindId: number, structureId: number, position: number): Observable<ServerResponseType> {
        return this.http.post<ServerResponseType>(
            `${BACKEND_URL}${this.ENDPOINT}/add-pause`,
            JSON.stringify({
                sId: structureId,
                bId: blindId,
                position
            })
        );
    }

    removeBlind$(blindId: number, structureId: number): Observable<ServerResponseType> {
        return this.authUtilService.getSub$().pipe(
            switchMap((sub: string) => this.http.delete<ServerResponseType>(`${BACKEND_URL}${this.ENDPOINT}/${structureId}/blind/${blindId}/${sub}`))
        );
    }

}
