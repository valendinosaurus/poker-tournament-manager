import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeriesApiService } from '../../../core/services/api/series-api.service';
import { combineLatest, Observable } from 'rxjs';
import { SeriesDetails } from '../../../shared/models/series-details.interface';
import { Formula, RankingService } from '../../../core/services/util/ranking.service';
import { Entry } from '../../../shared/models/entry.interface';
import { Finish } from '../../../shared/models/finish.interface';
import { EntryApiService } from '../../../core/services/api/entry-api.service';
import { FinishApiService } from '../../../core/services/api/finish-api.service';
import { tap } from 'rxjs/operators';
import { PlayerApiService } from '../../../core/services/api/player-api.service';
import { Player } from '../../../shared/models/player.interface';
import { TournamentApiService } from '../../../core/services/api/tournament-api.service';
import { Tournament } from '../../../shared/models/tournament.interface';
import { SeriesMetadata } from '../../../shared/models/series-metadata.interface';
import { TournamentInSeries } from '../../../shared/models/tournament-in-series.interface';
import { PlayerInSeries } from '../../../shared/models/player-in-series.interface';
import { CombinedEntriesFinishes } from '../../models/combined-entries-finishes.interface';
import { CombinedRanking } from '../../models/combined-ranking.interface';
import { OverallRanking } from '../../models/overall-ranking.interface';
import { CombinedFinish } from '../../models/combined-finish.interface';

@Component({
    selector: 'app-series-page',
    templateUrl: './series-page.component.html',
    styleUrls: ['./series-page.component.scss']
})
export class SeriesPageComponent implements OnInit {

    private route: ActivatedRoute = inject(ActivatedRoute);
    private seriesApiService: SeriesApiService = inject(SeriesApiService);
    private entryApiService: EntryApiService = inject(EntryApiService);
    private finishApiService: FinishApiService = inject(FinishApiService);
    private playerApiService: PlayerApiService = inject(PlayerApiService);
    private tournamentApiService: TournamentApiService = inject(TournamentApiService);
    private rankingService: RankingService = inject(RankingService);

    series$: Observable<SeriesDetails | null>;

    combined: CombinedEntriesFinishes[] = [];
    combinedRankings: CombinedRanking[] = [];
    overallRanking: OverallRanking[];

    formula: Formula;

    seriesId: number;
    password: string;

    formulaString: string | undefined;
    guaranteed: number;

    ngOnInit(): void {
        this.seriesId = this.route.snapshot.params['sId'];
        this.password = this.route.snapshot.params['password'];

        this.series$ = this.seriesApiService.getWithDetailsByPw$(this.seriesId, this.password).pipe(
            tap((series: SeriesDetails | null) => {

                this.formulaString = this.rankingService.getFormulaDesc(series?.rankFormula);

                if (series) {
                    this.getRankings();
                }

            })
        );
    }

    private getRankings(): void {
        combineLatest([
            this.finishApiService.getInSeries$(this.seriesId),
            this.entryApiService.getInSeries$(this.seriesId),
            this.playerApiService.getInSeries$(this.seriesId, this.password),
            this.tournamentApiService.getInSeries$(this.seriesId, this.password),
            this.seriesApiService.getSeriesMetadata$(this.seriesId, this.password)
        ]).pipe(
            tap(([finishes, entries, players, tournaments, seriesMetadata]: [Finish[], Entry[], PlayerInSeries[], TournamentInSeries[], SeriesMetadata]) => {
                const tIds = tournaments.map((t: TournamentInSeries) => t.id);

                tIds.forEach(
                    (id: number) => {
                        const localFinished: Finish[] = finishes.filter((f: Finish) => f.tournamentId === id);
                        const localEntries: Entry[] = entries.filter((e: Entry) => e.tournamentId === id);
                        const localPlayers: PlayerInSeries[] = players.filter((p: PlayerInSeries) => p.tId === id);
                        const localTournament: TournamentInSeries = tournaments.filter((t: TournamentInSeries) => t.id === id)[0];
                        localTournament.players = localPlayers.map((p: PlayerInSeries) => ({
                            image: p.image,
                            id: p.id,
                            name: p.name
                        }));
                        localTournament.entries = localEntries;
                        localTournament.finishes = localFinished;

                        const combo: CombinedEntriesFinishes = {
                            finish: localFinished,
                            entries: localEntries
                        };

                        this.combined.push(combo);

                        const combFinishes: CombinedFinish[] = localFinished.map(
                            (finish: Finish) => ({
                                image: localPlayers.filter(p => p.id === finish.playerId)[0]?.image,
                                name: localPlayers.filter(p => p.id === finish.playerId)[0]?.name,
                                rank: finish.rank,
                                price: finish.price,
                                rebuys: localEntries.filter(e => e.playerId === finish.playerId && e.type === 'REBUY').length,
                                addons: localEntries.filter(e => e.playerId === finish.playerId && e.type === 'ADDON').length,
                                reEntries: localEntries.filter(e => e.playerId === finish.playerId && e.type === 'RE-ENTRY').length,
                                points: 0
                            })
                        ).sort((a: CombinedFinish, b: CombinedFinish) => a.rank - b.rank);

                        let formula = undefined;

                        if (localTournament.rankFormula) {
                            formula = localTournament.rankFormula;
                        } else {
                            if (seriesMetadata?.rankFormula !== undefined && seriesMetadata?.rankFormula !== null) {
                                formula = seriesMetadata.rankFormula;
                            }
                        }

                        if (formula !== undefined) {
                            this.formula = this.rankingService.getFormulaById(formula);
                        }

                        const pricePool = this.getPricePool(localTournament);
                        const contribution = pricePool * seriesMetadata.percentage / 100;

                        this.combinedRankings.push({
                            combFinishes: combFinishes.map((c, i) => ({
                                ...c,
                                points: this.calcPoints(c, localTournament, this.formula)
                            })),
                            tournament: localTournament,
                            seriesMetadata,
                            pricePool: pricePool,
                            contribution: contribution > seriesMetadata.maxAmountPerTournament ? seriesMetadata.maxAmountPerTournament : contribution,
                            formulaText: this.rankingService.getFormulaDesc(localTournament.rankFormula)
                        });
                    }
                );

                this.merge();
            })
        ).subscribe();
    }

    merge(): void {
        this.overallRanking = [];

        const allPlayers: Player[] = this.combinedRankings.map(
            (c) => c.tournament.players
        ).reduce((a, b) => a.concat(b), []);

        this.combinedRankings.forEach(
            c => c.combFinishes.forEach(f => {
                if (this.overallRanking.filter(e => e.name === f.name).length > 0) {
                    const index = this.overallRanking.findIndex(o => o.name === f.name);

                    const element: OverallRanking = {...this.overallRanking[index]};

                    this.overallRanking[index] = {
                        name: f.name,
                        rank: +f.rank + +element.rank,
                        price: +f.price + +element.price,
                        image: f.image,
                        points: +f.points + +element.points,
                        tournaments: allPlayers.filter(e => e.name === f.name).length
                    };

                } else {
                    this.overallRanking.push({
                        name: f.name,
                        points: f.points,
                        image: f.image,
                        price: f.price,
                        rank: f.rank,
                        tournaments: allPlayers.filter(e => e.name === f.name).length
                    });
                }
            })
        );

        this.overallRanking = this.overallRanking.sort(
            (a: OverallRanking, b: OverallRanking) => b.points - a.points
        );

        this.guaranteed = this.combinedRankings.map(
            (r: CombinedRanking) => r.contribution
        ).reduce((acc: number, curr: number) => acc + curr, 0);
    }

    calcPoints(
        combFinish: CombinedFinish,
        tournament: Tournament,
        formula: Formula | undefined
    ): number {
        return formula ? formula({
            rank: +combFinish.rank,
            reEntries: +combFinish.reEntries,
            addons: +combFinish.addons,
            rebuys: +combFinish.rebuys,
            players: tournament.players.length,
            buyIn: tournament.buyInAmount,
            pricePool: +this.getPricePool(tournament),
            addonCost: tournament.addonAmount
        }) : 0;
    }

    getPricePool(tournament: Tournament): number {
        const buyInsReEntries: number = tournament.entries.filter(
            (entry: Entry) => entry.type === 'ENTRY' || entry.type === 'RE-ENTRY'
        ).length * tournament.buyInAmount;

        const rebuys: number = tournament.entries.filter(e => e.type === 'REBUY').length * tournament.rebuyAmount;
        const addons: number = tournament.entries.filter(e => e.type === 'ADDON').length * tournament.addonAmount;

        return buyInsReEntries + rebuys + addons + +tournament.initialPricePool;
    }

}