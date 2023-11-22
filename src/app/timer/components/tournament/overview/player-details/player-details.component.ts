import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { FinishApiService } from '../../../../../core/services/api/finish-api.service';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { FetchService } from '../../../../../core/services/fetch.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { defer, iif, of } from 'rxjs';
import { EventApiService } from '../../../../../core/services/api/event-api.service';
import { NotificationService } from '../../../../../core/services/notification.service';

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
    private eventApiService: EventApiService = inject(EventApiService);
    private notificationService: NotificationService = inject(NotificationService);

    private dialog: MatDialog = inject(MatDialog);

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

    removeSeatOpen(pId: number, playerName: string): void {
        const dialogRef = this.dialog.open(
            ConfirmationDialogComponent,
            {
                data: {
                    title: 'Remove Seat Open',
                    body: `Do you really want to remove the seat open of <strong>${playerName}</strong>`,
                    confirm: 'Remove Addon'
                }
            });

        dialogRef.afterClosed().pipe(
            switchMap((result: boolean) => iif(
                    () => result,
                    defer(() => this.finishApiService.delete$(this.tId, pId).pipe(
                            take(1),
                            catchError(() => {
                                this.notificationService.error('Error removing Seat Open');
                                return of(null);
                            }),
                            tap(() => {
                                this.notificationService.success(`Seat Open removed - ${playerName}`);
                            }),
                            tap(() => {
                                this.fetchService.trigger();
                            }),
                            switchMap(() => this.eventApiService.post$({
                                id: null,
                                tId: this.tId,
                                clientId: this.clientId
                            }))
                        )
                    ),
                    defer(() => of(null))
                )
            )
        ).subscribe();
    }

}
