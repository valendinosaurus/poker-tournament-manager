import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FetchService {

    private readonly fetchTrigger$ = new ReplaySubject<void>();
    
    getFetchTrigger$(): Observable<void> {
        return this.fetchTrigger$.asObservable();
    }

    trigger(): void {
        this.fetchTrigger$.next();
    }
}
