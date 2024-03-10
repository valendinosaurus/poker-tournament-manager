import { inject, Injectable } from '@angular/core';
import { Player } from '../../shared/models/player.interface';
import { OverallRanking } from '../../series/models/overall-ranking.interface';
import { CombinedRanking } from '../../series/models/combined-ranking.interface';
import { CombinedFinish } from '../../series/models/combined-finish.interface';
import { Tournament } from '../../shared/models/tournament.interface';
import { Formula, RankingService } from './util/ranking.service';
import { TournamentInSeries } from '../../shared/models/tournament-in-series.interface';
import { Finish } from '../../shared/models/finish.interface';
import { Entry } from '../../shared/models/entry.interface';
import { PlayerInSeries } from '../../shared/models/player-in-series.interface';
import { CombinedEntriesFinishes } from '../../series/models/combined-entries-finishes.interface';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { MathContent } from '../../shared/models/math-content.interface';

class SimpleStat {
}

@Injectable({
    providedIn: 'root'
})
export class SeriesService {

    formula: Formula;
    seriesId: number;
    password: string;

    formulaString: MathContent;
    guaranteed: number;
    combined: CombinedEntriesFinishes[] = [];
    combinedRankings: CombinedRanking[] = [];
    overallRanking: OverallRanking[];

    bestAverageRank: SimpleStat[];
    mostPrices: SimpleStat[];
    mostEffPrices: SimpleStat[];
    mostRebuysAddons: SimpleStat[];
    mostRebuysAddonsPerT: SimpleStat[];
    mostITM: SimpleStat[];
    mostPercITM: SimpleStat[];

    private rankingService: RankingService = inject(RankingService);

    calculateRankings(
        finishes: Finish[],
        entries: Entry[],
        players: PlayerInSeries[],
        tournaments: TournamentInSeries[],
        seriesMetadata: SeriesMetadata
    ): void {
        const tIds = tournaments.map((t: TournamentInSeries) => t.id).reverse();

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

                const wasDealMade = localFinished.length !== new Set(localFinished.map(e => e.rank)).size;
                const rankOfDeal = Math.min(...localFinished.map(e => e.rank));

                const combFinishes: CombinedFinish[] = localFinished.map(
                    (finish: Finish) => ({
                        image: localPlayers.filter(p => p.id === finish.playerId)[0]?.image,
                        name: localPlayers.filter(p => p.id === finish.playerId)[0]?.name,
                        rank: finish.rank,
                        price: finish.price,
                        rebuys: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.REBUY).length,
                        addons: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.ADDON).length,
                        reEntries: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.RE_ENTRY).length,
                        points: 0,
                        dealMade: wasDealMade && +finish.rank === rankOfDeal,
                    } as CombinedFinish)
                );

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

                const pricePool = this.rankingService.getSimplePricePool(localTournament);
                const contribution = pricePool * seriesMetadata.percentage / 100;

                this.combinedRankings.push({
                    combFinishes: combFinishes.map((c, i) => ({
                        ...c,
                        points: this.calcPoints(c, localTournament, this.formula),
                    })).sort((a: CombinedFinish, b: CombinedFinish) => a.rank - b.rank || b.points - a.points),
                    tournament: localTournament,
                    seriesMetadata,
                    pricePool: pricePool,
                    contribution: contribution > seriesMetadata.maxAmountPerTournament ? seriesMetadata.maxAmountPerTournament : contribution,
                    formulaText: this.rankingService.getFormulaDesc(localTournament.rankFormula),
                    playersAlive: localPlayers.filter(p => !localFinished.map(f => f.playerId).includes(p.id)).map(
                        (player: Player) => ({
                            ...player,
                            rebuys: localEntries.filter(e => e.playerId === player.id && e.type === EntryType.REBUY).length,
                            addons: localEntries.filter(e => e.playerId === player.id && e.type === EntryType.ADDON).length
                        })
                    )
                });
            }
        );

        this.merge();
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
                        tournaments: allPlayers.filter(e => e.name === f.name).length,
                        rebuysAddons: +element.rebuysAddons + +f.rebuys + +f.addons,
                        itm: +element.itm + ((+f.rank <= 4) ? 1 : 0)
                    };

                } else {
                    this.overallRanking.push({
                        name: f.name,
                        points: f.points,
                        image: f.image,
                        price: f.price,
                        rank: f.rank,
                        tournaments: allPlayers.filter(e => e.name === f.name).length,
                        rebuysAddons: +f.rebuys + +f.addons,
                        itm: (+f.rank <= 4) ? 1 : 0
                    });
                }
            })
        );

        const bar = this.overallRanking.filter(e => e.tournaments > 1).sort(
            (prev, curr) =>
                ((prev.rank / prev.tournaments) - (curr.rank / curr.tournaments))
        );

        this.bestAverageRank = bar.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.rank / e.tournaments,
            played: e.tournaments,
            image: e.image
        }));

        const mp = [...this.overallRanking].sort(
            (prev, curr) =>
                (prev.price - curr.price)
        ).reverse();

        this.mostPrices = mp.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.price,
            played: e.tournaments,
            image: e.image
        }));

        const mep = this.overallRanking
            .sort(
                (prev, curr) =>
                    (
                        (prev.price - ((prev.tournaments + prev.rebuysAddons) * 50))
                    ) - (
                        (curr.price - ((curr.tournaments + curr.rebuysAddons) * 50))
                    ) || prev.tournaments - curr.tournaments
            ).reverse();

        this.mostEffPrices = mep.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.price - ((e.tournaments + e.rebuysAddons) * 50),
            played: e.tournaments,
            image: e.image
        }));

        const mostRA = [...this.overallRanking].sort(
            (prev, curr) =>
                (prev.rebuysAddons - curr.rebuysAddons) || prev.tournaments - curr.tournaments
        ).reverse();

        this.mostRebuysAddons = mostRA.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.rebuysAddons,
            playerName: e.name,
            image: e.image
        }));

        const mostRAT = [...this.overallRanking].filter(e => e.tournaments > 1).sort(
            (prev, curr) =>
                ((prev.rebuysAddons / prev.tournaments) - (curr.rebuysAddons / curr.tournaments)) || prev.tournaments - curr.tournaments
        ).reverse();

        this.mostRebuysAddonsPerT = mostRAT.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.rebuysAddons / e.tournaments,
            playerName: e.name,
            image: e.image
        }));

        const mitm = [...this.overallRanking].sort(
            (a, b) => b.itm - a.itm || a.tournaments - b.tournaments
        );

        this.mostITM = mitm.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.itm,
            playerName: e.name,
            image: e.image
        }));

        const mpitm = [...this.overallRanking].sort(
            (a, b) => (b.itm / b.tournaments) - (a.itm / a.tournaments) || a.tournaments - b.tournaments
        );

        this.mostPercITM = mpitm.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.itm / e.tournaments * 100,
            playerName: e.name,
            image: e.image
        }));

        this.overallRanking = this.overallRanking.sort(
            (a: OverallRanking, b: OverallRanking) => b.points - a.points || a.rebuysAddons - b.rebuysAddons
        );

        this.guaranteed = this.combinedRankings.map(
            (r: CombinedRanking) => r.contribution
        ).reduce((acc: number, curr: number) => +acc + +curr, 0);
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
            pricePool: +this.rankingService.getSimplePricePool(tournament),
            addonCost: tournament.addonAmount
        }) : 0;
    }
}
