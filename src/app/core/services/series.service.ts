import { inject, Injectable } from '@angular/core';
import { Player } from '../../shared/models/player.interface';
import { LeaderboardRow } from '../../series/models/overall-ranking.interface';
import { SeriesTournament } from '../../series/models/combined-ranking.interface';
import { SeriesTournamentRow } from '../../series/models/combined-finish.interface';
import { Tournament, TournamentS } from '../../shared/models/tournament.interface';
import { Formula, RankingService } from './util/ranking.service';
import { TournamentInSeries } from '../../shared/models/tournament-in-series.interface';
import { Finish } from '../../shared/models/finish.interface';
import { Entry } from '../../shared/models/entry.interface';
import { PlayerInSeries } from '../../shared/models/player-in-series.interface';
import { EntryType } from '../../shared/enums/entry-type.enum';
import { SeriesMetadata } from '../../shared/models/series-metadata.interface';
import { SimpleStat } from '../../shared/models/simple-stat.interface';
import { SeriesDetailsS } from '../../shared/models/series-details.interface';
import { SeriesStats } from '../../series/page/series-page/series-page.component';
import { mostSpilled } from '../const/app.const';

@Injectable({
    providedIn: 'root'
})
export class SeriesService {

    formula: Formula;

    private rankingService: RankingService = inject(RankingService);

    calculateSeriesTournaments(
        seriesDetails: SeriesDetailsS,
        seriesMetadata: SeriesMetadata
    ): SeriesTournament[] {
        const tIds = seriesDetails.tournaments.map((t: TournamentInSeries) => t.id).reverse();
        const combinedRankings: SeriesTournament[] = [];

        tIds.forEach(
            (id: number) => {
                const tournament = seriesDetails.tournaments.filter(t => t.id === id)[0];
                const localFinished: Finish[] = tournament.finishes.filter((f: Finish) => f.tournamentId === id);
                const localEntries: Entry[] = tournament.entries.filter((e: Entry) => e.tournamentId === id);
                const localPlayers: PlayerInSeries[] = tournament.players.filter((p: PlayerInSeries) => p.tId === id);
                const localTournament: TournamentS = tournament; // tournaments.filter((t: TournamentInSeries) => t.id === id)[0];

                localTournament.players = localPlayers.map((p: PlayerInSeries) => ({
                    image: p.image,
                    id: p.id,
                    name: p.name,
                    tId: tournament.id,
                    email: p.email
                }));
                localTournament.entries = localEntries;
                localTournament.finishes = localFinished;

                const wasDealMade = localFinished.length !== new Set(localFinished.map(e => e.rank)).size;
                const rankOfDeal = Math.min(...localFinished.map(e => e.rank));

                let combFinishes: SeriesTournamentRow[] = localFinished.map(
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
                        isTemp: false,
                        email: localPlayers.filter(p => p.id === finish.playerId)[0]?.email,
                        playerId: finish.playerId
                    } as SeriesTournamentRow)
                );

                const nextRank = Math.min(...localFinished.map(e => e.rank));
                const booked = localFinished.map(e => e.playerId);
                const missing = localEntries.filter(e => e.type === EntryType.ENTRY).filter(
                    e => !booked.includes(e.playerId)
                );

                missing.forEach(finish => combFinishes.push({
                    rank: nextRank - 1,
                    image: localPlayers.filter(p => p.id === finish.playerId)[0]?.image,
                    name: localPlayers.filter(p => p.id === finish.playerId)[0]?.name,
                    rebuys: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.REBUY).length,
                    addons: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.ADDON).length,
                    reEntries: localEntries.filter(e => e.playerId === finish.playerId && e.type === EntryType.RE_ENTRY).length,
                    price: 0,
                    points: 0,
                    dealMade: false,
                    isTemp: true,
                    email: localPlayers.filter(p => p.id === finish.playerId)[0]?.email,
                    playerId: finish.playerId
                }));

                console.log(combFinishes);
                combFinishes = combFinishes.sort(
                    (a, b) => (b.isTemp ? nextRank : b.rank) - (a.isTemp ? nextRank : a.rank));

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

                combinedRankings.push({
                    combFinishes: combFinishes.map((c, i) => ({
                        ...c,
                        points: this.calcPoints(c, localTournament, this.formula),
                    })).sort((a: SeriesTournamentRow, b: SeriesTournamentRow) =>
                        (a.isTemp ? (nextRank - 1) : a.rank) - (b.isTemp ? (nextRank - 1) : b.rank)
                    ),
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

        return combinedRankings;
    }

    merge(combinedRankings: SeriesTournament[]): LeaderboardRow[] {
        const overallRanking: LeaderboardRow[] = [];

        const allPlayers: Player[] = combinedRankings.map(
            (c) => c.tournament.players
        ).reduce((a, b) => a.concat(b), []);

        combinedRankings.forEach(
            c => c.combFinishes.forEach((f: SeriesTournamentRow) => {
                if (overallRanking.filter(e => e.name === f.name).length > 0) {
                    const index = overallRanking.findIndex(o => o.name === f.name);

                    const element: LeaderboardRow = {...overallRanking[index]};

                    overallRanking[index] = {
                        name: f.name,
                        rank: +f.rank + +element.rank,
                        price: +f.price + +element.price,
                        image: f.image,
                        points: +f.points + +element.points,
                        tournaments: allPlayers.filter(e => e.name === f.name).length,
                        rebuysAddons: +element.rebuysAddons + +f.rebuys + +f.addons,
                        itm: +element.itm + ((+f.rank <= 4) ? 1 : 0),
                        isTemp: f.isTemp ? true : element.isTemp,
                        email: f.email,
                        playerId: f.playerId
                    };

                } else {
                    overallRanking.push({
                        name: f.name,
                        points: f.points,
                        image: f.image,
                        price: f.price,
                        rank: f.rank,
                        tournaments: allPlayers.filter(e => e.name === f.name).length,
                        rebuysAddons: +f.rebuys + +f.addons,
                        itm: (+f.rank <= 4) ? 1 : 0,
                        isTemp: f.isTemp,
                        email: f.email,
                        playerId: f.playerId
                    });
                }
            })
        );

        return overallRanking;
    }

    getBestAverageRank(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const bar = overallRanking.filter(e => e.tournaments > 1).sort(
            (prev, curr) =>
                ((prev.rank / prev.tournaments) - (curr.rank / curr.tournaments))
        );

        return bar.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.rank / e.tournaments,
            played: e.tournaments,
            image: e.image
        }));
    }

    getMostPrices(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mp = overallRanking.sort(
            (prev, curr) =>
                (prev.price - curr.price)
        ).reverse();

        return mp.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.price,
            played: e.tournaments,
            image: e.image
        }));
    }

    getMostEffectivePrices(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mep = overallRanking
            .sort(
                (prev, curr) =>
                    (
                        (prev.price - ((prev.tournaments + prev.rebuysAddons) * 50))
                    ) - (
                        (curr.price - ((curr.tournaments + curr.rebuysAddons) * 50))
                    ) || prev.tournaments - curr.tournaments
            ).reverse();

        return mep.slice(0, 7).map(e => ({
            playerName: e.name,
            value: e.price - ((e.tournaments + e.rebuysAddons) * 50),
            played: e.tournaments,
            image: e.image
        }));
    }

    getMostRebuysAddons(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mostRA = overallRanking.sort(
            (prev, curr) =>
                (prev.rebuysAddons - curr.rebuysAddons) || prev.tournaments - curr.tournaments
        ).reverse();

        return mostRA.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.rebuysAddons,
            playerName: e.name,
            image: e.image
        }));
    }

    getMostRebuysAddonsPerTournament(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mostRAT = overallRanking.filter(e => e.tournaments > 1).sort(
            (prev, curr) =>
                ((prev.rebuysAddons / prev.tournaments) - (curr.rebuysAddons / curr.tournaments)) || prev.tournaments - curr.tournaments
        ).reverse();

        return mostRAT.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.rebuysAddons / e.tournaments,
            playerName: e.name,
            image: e.image
        }));
    }

    getMostITM(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mitm = overallRanking.sort(
            (a, b) => b.itm - a.itm || a.tournaments - b.tournaments
        );

        return mitm.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.itm,
            playerName: e.name,
            image: e.image
        }));
    }

    getMostPercentualITM(overallRanking: LeaderboardRow[]): SimpleStat[] {
        const mpitm = overallRanking.sort(
            (a, b) => (b.itm / b.tournaments) - (a.itm / a.tournaments) || a.tournaments - b.tournaments
        );

        return mpitm.slice(0, 7).map(e => ({
            played: e.tournaments,
            value: e.itm / e.tournaments * 100,
            playerName: e.name,
            image: e.image
        }));
    }

    getSoretedOverallRanking(overallRanking: LeaderboardRow[]): LeaderboardRow[] {
        return overallRanking.sort(
            (a: LeaderboardRow, b: LeaderboardRow) => b.points - a.points || a.rebuysAddons - b.rebuysAddons
        );
    }

    getGuaranteedFromSeries(series: SeriesDetailsS): number {
        const percentage = series.percentage;
        const cap = +series.maxAmountPerTournament;
        let guaranteed = 0;

        series.tournaments.forEach((tournament: TournamentS) => {
            const buyIns = tournament.entries.length * tournament.buyInAmount;
            const contribution = +(buyIns * percentage / 100);

            guaranteed += contribution >= cap ? cap : contribution;
        });

        return guaranteed;
    }

    calcPoints(
        combFinish: SeriesTournamentRow,
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

    calcSeriesStats(leaderboard: LeaderboardRow[]): SeriesStats {
        return {
            bestAverageRank: this.getBestAverageRank(leaderboard),
            mostPrices: this.getMostPrices([...leaderboard]),
            mostEffPrices: this.getMostEffectivePrices([...leaderboard]),
            mostRebuysAddons: this.getMostRebuysAddons([...leaderboard]),
            mostRebuysAddonsPerT: this.getMostRebuysAddonsPerTournament([...leaderboard]),
            mostITM: this.getMostITM([...leaderboard]),
            mostPercITM: this.getMostPercentualITM([...leaderboard]),
            mostSpilled: mostSpilled
        };
    }
}
