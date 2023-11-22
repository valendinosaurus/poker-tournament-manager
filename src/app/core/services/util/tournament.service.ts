import { Injectable } from '@angular/core';
import { Player } from '../../../shared/models/player.interface';
import { Entry } from '../../../shared/models/entry.interface';
import { Tournament } from '../../../shared/models/tournament.interface';
import { ConductedEntry } from '../../../shared/models/conducted-entry.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';

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
                isBlocked: tournament.entries.filter(e => e.type === EntryType.ADDON || e.type === EntryType.REBUY).map(e => e.playerId).includes(entry.playerId)
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
}
