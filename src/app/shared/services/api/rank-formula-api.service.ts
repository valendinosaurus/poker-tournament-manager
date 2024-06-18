import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RankFormula } from '../../interfaces/rank-formula.interface';
import { BACKEND_URL } from '../../../app.const';

@Injectable({
    providedIn: 'root'
})
export class RankFormulaApiService {

    private readonly ENDPOINT = 'rank-formula';

    private http: HttpClient = inject(HttpClient);

    getAll$(): Observable<RankFormula[]> {
        return this.http.get<RankFormula[]>(`${BACKEND_URL}${this.ENDPOINT}`);
    }

}
