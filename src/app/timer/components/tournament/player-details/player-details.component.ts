import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { FinishApiService } from '../../../../core/services/api/finish-api.service';
import { take, tap } from 'rxjs/operators';
import { FetchService } from '../../../../core/services/fetch.service';

@Component({
    selector: 'app-player-details',
    templateUrl: './player-details.component.html',
    styleUrls: ['./player-details.component.scss']
})
export class PlayerDetailsComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() finishes: Finish[];
    @Input() trigger: string | null;
    @Input() tId: number;

    combination: {
        image: string;
        name: string;
        rebuys: number;
        addons: number;
        reEntries: number;
        isFinished: boolean;
        isLastFinished: boolean;
        rank: number | undefined;
        pId: number;
    }[];

    private fetchService: FetchService = inject(FetchService);
    private finishApiService: FinishApiService = inject(FinishApiService);

    ngOnChanges(changes: SimpleChanges): void {
        const minRank = Math.min(...this.finishes.map(f => f.rank));
        console.log('IN', minRank);

        if (this.players && this.entries) {
            this.combination = this.players.map(
                (player: Player) => {
                    const rank: number | undefined = this.finishes.find(f => f.playerId === player.id)?.rank;
                    let isLastFinished = false;

                    if (rank) {
                        isLastFinished = +rank === +minRank;
                    }

                    return {
                        image: player.image,
                        name: player.name,
                        rebuys: this.entries.filter(e => e.playerId === player.id && e.type === 'REBUY').length,
                        addons: this.entries.filter(e => e.playerId === player.id && e.type === 'ADDON').length,
                        reEntries: this.entries.filter(e => e.playerId === player.id && (e.type === 'ENTRY' || e.type === 'RE-ENTRY')).length,
                        isFinished: this.finishes.map(f => f.playerId).includes(player.id),
                        isLastFinished: isLastFinished,
                        rank: rank,
                        pId: player.id
                    };
                }
            ).sort((a, b) => {
                if (a.rank && b.rank) {
                    return a.rank - b.rank;
                }

                if (a.rank && !b.rank) {
                    return 1;
                }

                if (!a.rank && b.rank) {
                    return -1;
                }

                return 1;
            });
        }
    }

    removeSeatOpen(pId: number): void {
        console.log('REMOVE PD');
        this.finishApiService.delete$(this.tId, pId).pipe(
            take(1),
            tap(() => {
                this.fetchService.trigger();
            })
        ).subscribe();
    }

}
