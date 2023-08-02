import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournament } from '../../../shared/models/tournament.interface';
import { dummyTourney } from '../../../shared/data/dummy-tournament.const';
import { combineLatest, Observable, of } from 'rxjs';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { BlindLevelApiService } from '../../../core/services/api/blind-level-api.service';
import { map, shareReplay } from 'rxjs/operators';
import { BlindLevel } from '../../../shared/models/blind-level.interface';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { Player } from '../../../shared/models/player.interface';
import { EntryApiService } from '../../../core/services/api/entry-api.service';
import { Entry } from '../../../shared/models/entry.interface';
import { FinishApiService } from '../../../core/services/api/finish-api.service';
import { Finish } from '../../../shared/models/finish.interface';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';

@Component({
    selector: 'app-timer-page',
    templateUrl: './timer-page.component.html',
    styleUrls: ['./timer-page.component.scss']
})
export class TimerPageComponent implements OnInit {

    tournament$: Observable<Tournament>;
    seriesMetadata$: Observable<SeriesMetadata>;
    playersInTheHole$: Observable<Player[]>;
    isSimpleTournament = false;

    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private blindLevelApiService: BlindLevelApiService = inject(BlindLevelApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private route: ActivatedRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        const param = this.route.snapshot.params['tId'];

        if (param) {
            const tourney$ = this.tournamentApiService.get$(+param).pipe(shareReplay(1));
            const blinds$ = this.blindLevelApiService.getOfTournament$(+param).pipe(shareReplay(1));
            const players$ = this.playerApiService.getInTournament$(+param).pipe(shareReplay(1));
            const entries$ = this.entryApiService.getInTournament$(+param).pipe(shareReplay(1));
            const finishes$ = this.finishApiService.getInTournament$(+param).pipe(shareReplay(1));

            this.seriesMetadata$ = this.tournamentApiService.getSeriesMetadata$(+param);

            const pureEntries$ = entries$.pipe(map((entries) => entries.filter(e => e.type === 'ENTRY')));

            this.playersInTheHole$ = combineLatest([
                players$,
                pureEntries$
            ]).pipe(
                map(([players, pureEntries]) => players.filter(p => !pureEntries.map(e => e.playerId).includes(p.id ?? -1))),
            );

            this.tournament$ = combineLatest([
                tourney$,
                blinds$,
                players$,
                entries$,
                finishes$
            ]).pipe(
                map(([tourney, blinds, players, entries, finishes]: [Tournament, BlindLevel[], Player[], Entry[], Finish[]]) => ({
                    ...tourney,
                    structure: blinds,
                    players: players,
                    entries: entries,
                    finishes: finishes
                }) as Tournament)
            );

        } else {
            this.tournament$ = of(dummyTourney);
            this.isSimpleTournament = true;
        }
    }

}
