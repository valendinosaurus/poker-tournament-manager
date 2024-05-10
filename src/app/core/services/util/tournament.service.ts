import { inject, Injectable } from '@angular/core';
import { Player } from '../../../shared/models/player.interface';
import { Entry } from '../../../shared/models/entry.interface';
import { Tournament } from '../../../shared/models/tournament.interface';
import { ConductedEntry } from '../../../shared/models/util/conducted-entry.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';
import { ConductedFinish } from '../../../shared/models/util/conducted-finish.interface';
import { Finish } from '../../../shared/models/finish.interface';
import { ConductedElimination } from '../../../shared/models/util/conducted-elimination.interface';
import { Elimination } from '../../../shared/models/elimination.interface';
import { switchMap } from 'rxjs/operators';
import { ActionEventApiService } from '../api/action-event-api.service';
import { TimerStateService } from '../../../timer/services/timer-state.service';

@Injectable({
    providedIn: 'root'
})
export class TournamentService {

    private actionEventApiService: ActionEventApiService = inject(ActionEventApiService);
    private timerStateService: TimerStateService = inject(TimerStateService);

    postActionEvent$ =
        switchMap(() => this.actionEventApiService.post$({
            id: null,
            tId: this.timerStateService.tournament().id,
            clientId: this.timerStateService.clientId()
        }));

    getPlayersEligibleForEntryOrReEntry(tournament: Tournament, isReEntry: boolean): Player[] {
        return tournament.players
            .filter(player => {
                const finishedIds = tournament.finishes.map(f => f.playerId);
                return isReEntry ? finishedIds.includes(player.id) : !finishedIds.includes(player.id);
            }).filter(player => {
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
