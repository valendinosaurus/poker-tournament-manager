import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { FinishApiService } from '../../../../../core/services/api/finish-api.service';
import { FetchService } from '../../../../../core/services/fetch.service';
import { MatDialog } from '@angular/material/dialog';
import { ActionEventApiService } from '../../../../../core/services/api/action-event-api.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { EliminationApiService } from '../../../../../core/services/api/elimination-api.service';

@Component({
    selector: 'app-player-details',
    templateUrl: './player-details.component.html',
    styles: [':host{display: contents}'],
})
export class PlayerDetailsComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() finishes: Finish[];
    @Input() clientId: number;
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
    private eventApiService: ActionEventApiService = inject(ActionEventApiService);
    private notificationService: NotificationService = inject(NotificationService);
    private eliminationApiService: EliminationApiService = inject(EliminationApiService);

    private dialog: MatDialog = inject(MatDialog);

    ngOnChanges(changes: SimpleChanges): void {
        const minRank = Math.min(...this.finishes.map(f => f.rank));

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
                        rebuys: this.entries.filter(e => e.playerId === player.id && e.type === EntryType.REBUY).length,
                        addons: this.entries.filter(e => e.playerId === player.id && e.type === EntryType.ADDON).length,
                        reEntries: this.entries.filter(e => e.playerId === player.id && (e.type === EntryType.ENTRY || e.type === EntryType.RE_ENTRY)).length,
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

}
