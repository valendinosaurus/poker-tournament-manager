import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServerResponse } from '../../../shared/models/server-response';
import { HttpClient } from '@angular/common/http';
import { BACKEND_URL } from '../../../app.const';
import {
    AddonEvent, DeleteRebuyAddonEvent,
    DeleteSeatOpenEvent,
    RebuyEvent,
    SeatOpenEvent
} from '../../../shared/models/util/seat-open-event.interface';

@Injectable({
    providedIn: 'root'
})
export class TimerApiService {

    private readonly ENDPOINT = 'timer';

    private http: HttpClient = inject(HttpClient);

    seatOpen$(payload: SeatOpenEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/seat-open`,
            JSON.stringify(payload)
        );
    }

    deleteSeatOpen$(payload: DeleteSeatOpenEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/delete-seat-open`,
            JSON.stringify(payload)
        );
    }

    rebuy$(payload: RebuyEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/rebuy`,
            JSON.stringify(payload)
        );
    }

    deleteRebuy$(payload: DeleteRebuyAddonEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/delete-rebuy`,
            JSON.stringify(payload)
        );
    }

    addon$(payload: AddonEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/addon`,
            JSON.stringify(payload)
        );
    }

    deleteAddon$(payload: DeleteRebuyAddonEvent): Observable<ServerResponse> {
        return this.http.post<ServerResponse>(
            `${BACKEND_URL}${this.ENDPOINT}/delete-addon`,
            JSON.stringify(payload)
        );
    }

}
