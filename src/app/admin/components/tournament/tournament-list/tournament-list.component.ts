import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { TriggerService } from '../../../../core/services/util/trigger.service';
import { TournamentApiService } from '../../../../core/services/api/tournament-api.service';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { TournamentDetails } from '../../../../shared/models/tournament-details.interface';

@Component({
    selector: 'app-tournament-list',
    templateUrl: './tournament-list.component.html',
    styleUrls: ['./tournament-list.component.scss']
})
export class TournamentListComponent implements OnInit {

    tournaments$: Observable<TournamentDetails[]>;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private triggerService: TriggerService = inject(TriggerService);

    ngOnInit(): void {
        this.tournaments$ = this.triggerService.getTournamentsTrigger$().pipe(
            switchMap(() => this.tournamentApiService.getAllWithDetails$().pipe(
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
