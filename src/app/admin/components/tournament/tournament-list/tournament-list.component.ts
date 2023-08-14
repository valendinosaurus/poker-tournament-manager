import { Component, inject, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { TournamentDetails } from '../../../../shared/models/tournament-details.interface';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
    selector: 'app-tournament-list',
    templateUrl: './tournament-list.component.html',
    styleUrls: ['./tournament-list.component.scss']
})
export class TournamentListComponent implements OnInit {

    tournaments$: Observable<TournamentDetails[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private triggerService: TriggerService = inject(TriggerService);
    private authService: AuthService = inject(AuthService);

    ngOnInit(): void {
        this.tournaments$ = combineLatest([
            this.triggerService.getTournamentsTrigger$(),
            this.authService.user$
        ]).pipe(
            map(([_trigger, user]: [void, User | null | undefined]) => user?.sub ?? ''),
            filter((sub: string) => sub.length > 0),
            switchMap((sub: string) => this.tournamentApiService.getAllWithDetails$(sub).pipe(
                map((tournaments) => tournaments.map(t => ({
                    ...t,
                    finishes: []
                })))
            )),
            shareReplay(1)
        );
    }

    reload(): void {
        this.triggerService.triggerTournaments();
    }

}
