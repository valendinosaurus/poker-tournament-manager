import { Injectable } from '@angular/core';
import { Player } from '../../../shared/models/player.interface';
import { Entry } from '../../../shared/models/entry.interface';
import { Tournament } from '../../../shared/models/tournament.interface';

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
                        (entry: Entry) => entry.playerId === player.id && entry.type === 'RE-ENTRY'
                    ).length;

                    return rebuysOfPlayer < allowed;
                }

                const enteredPlayers = tournament.entries.filter(
                    (entry: Entry) => entry.playerId === player.id && entry.type === 'ENTRY'
                ).map(e => e.playerId);

                return !enteredPlayers.includes(player.id);
            });
    }

    getPlayersEligibleForRebuy(tournament: Tournament): Player[] {
        return tournament.players.filter(
            player => !tournament.finishes.map(f => f.playerId).includes(player.id)
        ).filter(
            player => tournament.entries.filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === 'REBUY'
            ).length < tournament.noOfRebuys
        );
    }

    getPlayersEligibleForAddon(tournament: Tournament): Player[] {
        return tournament.players.filter(player => {
            const finishedIds = tournament.finishes.map(f => f.playerId);

            return !finishedIds.includes(player.id);
        }).filter(player => {
            const allowed = 1;
            const addonsOfPlayer = tournament.entries.filter(
                (entry: Entry) => entry.playerId === player.id && entry.type === 'ADDON'
            ).length;

            return addonsOfPlayer < allowed;
        });
    }

    getPlayersEligibleForSeatOpen(tournament: Tournament): Player[] {
        return tournament.players.filter(player => {
            const finishedIds = tournament.finishes.map(f => f.playerId);

            return !finishedIds.includes(player.id);
        })
    }
}
