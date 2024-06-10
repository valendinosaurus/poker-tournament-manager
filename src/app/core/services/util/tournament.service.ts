import { inject, Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { ActionEventApiService } from '../api/action-event-api.service';
import { TimerStateService } from '../../../timer/services/timer-state.service';
import {
    AddonEvent,
    DeleteRebuyAddonEvent,
    RebuyEvent,
    SeatOpenEvent
} from '../../../shared/interfaces/util/seat-open-event.interface';
import { EntryType } from '../../../shared/enums/entry-type.enum';
import { TEventType } from '../../../shared/enums/t-event-type.enum';
import { Finish } from '../../../shared/interfaces/finish.interface';
import { RankingService } from './ranking.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
    providedIn: 'root'
})
export class TournamentService {

    private actionEventApiService: ActionEventApiService = inject(ActionEventApiService);
    private state: TimerStateService = inject(TimerStateService);
    private rankingService: RankingService = inject(RankingService);
    private localStorageService: LocalStorageService = inject(LocalStorageService);

    postActionEvent$ =
        switchMap(() => this.actionEventApiService.post$({
            id: null,
            tId: this.state.tournament().id,
            clientId: this.state.clientId()
        }));

    getRebuyEvent(playerId: number, eliminatedById: number): RebuyEvent {
        const eliminated = this.state.playersToRebuy().filter(e => e.value === playerId)[0].label;
        const eliminator = this.state.playersToRebuy().filter(e => e.value === eliminatedById)[0].label;

        return {
            tournamentId: this.state.tournament().id,
            clientId: this.state.clientId(),
            entry: {
                id: undefined,
                playerId: playerId,
                tournamentId: this.state.tournament().id,
                type: EntryType.REBUY,
                timestamp: -1
            },
            elimination: {
                eliminator: eliminatedById,
                eliminated: playerId,
                tournamentId: this.state.tournament().id,
                timestamp: -1,
                eId: ''
            },
            tEvent: {
                id: undefined,
                tId: this.state.tournament().id,
                message: `Rebuy for <strong>${eliminated}</strong>, who was kicked out by ${eliminator}!`,
                type: TEventType.REBUY,
                timestamp: -1,
            }
        };
    }

    getDeleteRebuyEvent(entryId: number, playerName: string): DeleteRebuyAddonEvent {
        return {
            entryId,
            tEvent: {
                id: undefined,
                tId: this.state.tournament().id,
                message: `Player ${playerName} cancelled his Rebuy!`,
                type: TEventType.CORRECTION,
                timestamp: -1
            }
        };
    }

    getAddonEvent(playerId: number): AddonEvent {
        const playerName = this.state.playersToAddOn().filter(e => e.value === playerId)[0].label;

        return {
            tournamentId: this.state.tournament().id,
            clientId: this.state.clientId(),
            entry: {
                id: undefined,
                playerId: playerId,
                tournamentId: this.state.tournament().id,
                type: EntryType.ADDON,
                timestamp: -1
            },
            tEvent: {
                id: undefined,
                tId: this.state.tournament().id,
                message: `Addon for <strong>${playerName}</strong>!`,
                type: TEventType.ADDON,
                timestamp: -1,
            }
        };
    }

    getDeleteAddonEvent(entryId: number, playerName: string): DeleteRebuyAddonEvent {
        return {
            entryId,
            tEvent: {
                id: undefined,
                tId: this.state.tournament().id,
                message: `Player ${playerName} cancelled his Addon!`,
                type: TEventType.CORRECTION,
                timestamp: -1
            }
        };
    }

    getSeatOpenEvent(
        playerId: number,
        eliminatedById: number,
        price: number,
        rank: number,
    ): SeatOpenEvent {
        const playerName = this.state.tournament().players.filter(e => e.id === playerId)[0].name;
        const {eliminated, eliminator} = this.getInvolvedPlayerNames(playerId, eliminatedById);

        const seatOpenEventNew: SeatOpenEvent = {
            tournamentId: this.state.tournament().id,
            clientId: this.state.clientId(),
            finishes: [
                {
                    tournamentId: this.state.tournament().id,
                    price: price,
                    rank: rank,
                    playerId: playerId,
                    timestamp: -1
                }
            ],
            elimination: {
                tournamentId: this.state.tournament().id,
                eliminated: playerId,
                eliminator: eliminatedById,
                eId: `F-${this.state.tournament().id}-${playerId}`,
                timestamp: -1
            },
            tEvents: [
                {
                    id: undefined,
                    tId: this.state.tournament().id,
                    message: `<strong>!!! SEAT OPEN !!!</strong> - <strong>${playerName}</strong> is out of the tournament!`,
                    type: TEventType.SEAT_OPEN,
                    timestamp: -1
                },
                {
                    id: undefined,
                    tId: this.state.tournament().id,
                    message: `<strong>${eliminated}</strong> was kicked out by <strong>${eliminator}</strong>!`,
                    type: TEventType.ELIMINATION,
                    timestamp: -1
                }
            ]
        };

        const winner: Finish = this.getRemainingFinish(eliminatedById, rank);
        const name = this.state.playersToEliminate().filter(e => e.value === winner.playerId)[0].label;

        if (rank === 2) {
            seatOpenEventNew.finishes.push(winner);
            seatOpenEventNew.tEvents.push({
                id: undefined,
                tId: this.state.tournament().id,
                message: `<strong>FINISHED! ${name}</strong> wins the tournament and takes home ${winner.price}.-! Congratulations!`,
                type: TEventType.FINISH,
                timestamp: -1
            });
        }

        return seatOpenEventNew;
    }

    private getInvolvedPlayerNames(pId: number, eById: number): { eliminated: string, eliminator: string } {
        return {
            eliminated: this.state.playersToEliminate().filter(e => e.value === pId)[0].label,
            eliminator: this.state.playersToEliminate().filter(e => e.value === eById)[0].label
        };
    }

    private getRemainingFinish(eliminator: number, rank: number): Finish {
        const adaptedPayouts: number[] | undefined = this.localStorageService.getAdaptedPayoutById(this.state.tournament().id);
        const payouts = this.rankingService.getPayoutById(this.state.tournament().payout);
        const payoutPercentage = +payouts[0];

        let price = 0;

        if (adaptedPayouts) {
            price = adaptedPayouts[rank - 2];
        } else {
            price = this.state.totalPricePool() / 100 * payoutPercentage;
        }

        return {
            rank: 1,
            tournamentId: this.state.tournament().id,
            price,
            playerId: eliminator,
            timestamp: -1,
        };
    }

}
