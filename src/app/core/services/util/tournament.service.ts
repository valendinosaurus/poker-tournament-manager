import { Injectable } from '@angular/core';
import { Player } from '../../../shared/models/player.interface';
import { Entry } from '../../../shared/models/entry.interface';
import { Tournament } from '../../../shared/models/tournament.interface';
import { ConductedEntry } from '../../../shared/models/util/conducted-entry.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';
import { ConductedFinish } from '../../../shared/models/util/conducted-finish.interface';
import { Finish } from '../../../shared/models/finish.interface';
import { ConductedElimination } from '../../../shared/models/util/conducted-elimination.interface';
import { Elimination } from '../../../shared/models/elimination.interface';

@Injectable({
    providedIn: 'root'
})
export class TournamentService {

    getPlayersEligibleForEntryOrReEntry(tournament: Tournament, isReEntry: boolean): Player[] {
        return tournament.players
            .filter(player => {
                const finishedIds = tournament.finishes.map(f => f.playerId);
                return isReEntry ? finishedIds.includes(player.id) : !finishedIds.includes(player.id);
            })
            .filter(player => {
                if (isReEntry) {
                    const allowed = tournament.noOfReEntries;
                    const rebuysOfPlayer = tournament.entries.filter(
                        (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.RE_ENTRY
                    ).length;

                    return rebuysOfPlayer < allowed;
                }

                const enteredPlayers = tournament.entries.filter(
                    (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.ENTRY
                ).map(e => e.playerId);

                return !enteredPlayers.includes(player.id);
            });
    }

    getConductedEntries(tournament: Tournament): ConductedEntry[] {
        return tournament.entries.filter(
            (entry: Entry) => entry.type === EntryType.ENTRY || entry.type === EntryType.RE_ENTRY
        ).map(
            (entry: Entry) => ({
                entryId: entry.id ?? -1,
                time: entry.timestamp,
                playerId: (tournament.players.filter(p => p.id === entry.playerId)[0].id) ?? -1,
                name: (tournament.players.filter(p => p.id === entry.playerId)[0].name) ?? '',
                image: (tournament.players.filter(p => p.id === entry.playerId)[0].image) ?? '',
                isFinished: tournament.finishes.map(f => f.playerId).includes(entry.playerId),
                type: entry.type,
                isBlocked: tournament.entries.filter(e => e.type === EntryType.ADDON
                    || e.type === EntryType.REBUY).map(e => e.playerId).includes(entry.playerId)
            })
        );
    }

    getPlayersEligibleForRebuy(tournament: Tournament): Player[] {
        return tournament.players.filter(
            player => !tournament.finishes.map(f => f.playerId).includes(player.id)
        ).filter(
            player => tournament.entries.filter(e => e.type === EntryType.ENTRY).map(f => f.playerId).includes(player.id)
        ).filter(
            player => tournament.entries.filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.REBUY
            ).length < tournament.noOfRebuys
        );
    }

    getConductedRebuys(tournament: Tournament): ConductedEntry[] {
        return tournament.entries.filter(
            (entry: Entry) => entry.type === EntryType.REBUY
        ).map(
            (entry: Entry) => ({
                entryId: entry.id ?? -1,
                time: entry.timestamp,
                playerId: (tournament.players.filter(p => p.id === entry.playerId)[0].id) ?? -1,
                name: (tournament.players.filter(p => p.id === entry.playerId)[0].name) ?? '',
                image: (tournament.players.filter(p => p.id === entry.playerId)[0].image) ?? '',
                isFinished: tournament.finishes.map(f => f.playerId).includes(entry.playerId),
                type: entry.type
            })
        );
    }

    getPlayersEligibleForAddon(tournament: Tournament): Player[] {
        return tournament.players.filter(
            player => !tournament.finishes.map(f => f.playerId).includes(player.id)
        ).filter(
            player => tournament.entries.filter(e => e.type === EntryType.ENTRY).map(f => f.playerId).includes(player.id)
        ).filter(player => {
            const allowed = 1;
            const addonsOfPlayer = tournament.entries.filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === EntryType.ADDON
            ).length;

            return addonsOfPlayer < allowed;
        });
    }

    getConductedAddons(tournament: Tournament): ConductedEntry[] {
        return tournament.entries.filter(
            (entry: Entry) => entry.type === EntryType.ADDON
        ).map(
            (entry: Entry) => ({
                entryId: entry.id ?? -1,
                time: entry.timestamp,
                playerId: (tournament.players.filter(p => p.id === entry.playerId)[0].id) ?? -1,
                name: (tournament.players.filter(p => p.id === entry.playerId)[0].name) ?? '',
                image: (tournament.players.filter(p => p.id === entry.playerId)[0].image) ?? '',
                isFinished: tournament.finishes.map(f => f.playerId).includes(entry.playerId),
                type: entry.type
            })
        );
    }

    getPlayersEligibleForSeatOpen(tournament: Tournament): Player[] {
        return tournament.players.filter(
            player => !tournament.finishes.map(f => f.playerId).includes(player.id)
        ).filter(
            player => tournament.entries.filter(e => e.type === EntryType.ENTRY).map(f => f.playerId).includes(player.id)
        );
    }

    getConductedSeatOpens(tournament: Tournament): ConductedFinish[] {
        return tournament.finishes.map(
            (finish: Finish) => ({
                tId: tournament.id,
                playerId: finish.playerId,
                image: tournament.players.filter(p => p.id === finish.playerId)[0].image,
                name: tournament.players.filter(p => p.id === finish.playerId)[0].name,
                time: finish.timestamp,
                rank: +finish.rank
            })
        ).sort(
            (a, b) => a.rank - b.rank
        );
    }

    getConductedEliminations(tournament: Tournament): ConductedElimination[] {
        return tournament.eliminations
            .filter((elimination: Elimination) => elimination.eliminator !== -1)
            .map(
                (elimination: Elimination) => ({
                    tId: tournament.id,
                    eliminatorId: elimination.eliminator,
                    eliminatorImage: tournament.players.filter(p => p.id === elimination.eliminator)[0].image,
                    eliminatorName: tournament.players.filter(p => p.id === elimination.eliminator)[0].name,
                    eliminatedId: elimination.eliminated,
                    eliminatedImage: tournament.players.filter(p => p.id === elimination.eliminated)[0].image,
                    eliminatedName: tournament.players.filter(p => p.id === elimination.eliminated)[0].name,
                    time: elimination.timestamp,
                    eId: elimination.eId
                })
            );
    }

    getCanStartTournament(tournament: Tournament): boolean {
        const noOfPlayers = tournament.players.length;
        const entryIds = tournament.entries.filter(
            (entry: Entry) => entry.type === EntryType.ENTRY
        ).map(
            (entry: Entry) => entry.playerId
        );

        const noOfDistinctEntries = Array.from(new Set(entryIds)).length;

        return noOfPlayers === noOfDistinctEntries;
    }

}
