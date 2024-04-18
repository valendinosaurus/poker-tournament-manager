import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { BulletsComponent } from '../../../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Elimination } from '../../../../../shared/models/elimination.interface';

@Component({
    selector: 'app-player-details',
    templateUrl: './player-details.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [
        NgFor,
        NgIf,
        UserImageRoundComponent,
        BulletsComponent,
        DecimalPipe,
    ],
})
export class PlayerDetailsComponent implements OnChanges {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() finishes: Finish[];
    @Input() eliminations: Elimination[];
    @Input() clientId: number;
    @Input() trigger: string | null;
    @Input() tId: number;

    combination: {
        image: string;
        name: string;
        rebuys: number;
        addons: number;
        eliminations: number;
        reEntries: number;
        isFinished: boolean;
        isLastFinished: boolean;
        rank: number | undefined;
        pId: number;
    }[];

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
                        eliminations: this.eliminations.filter(e => e.eliminator === player.id).length,
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
