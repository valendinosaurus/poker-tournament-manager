import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { Player } from '../../../../../shared/models/player.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { BulletsComponent } from '../../../../../shared/components/bullets/bullets.component';
import { UserImageRoundComponent } from '../../../../../shared/components/user-image-round/user-image-round.component';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TimerStateService } from '../../../../services/timer-state.service';

interface Combination {
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
};

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
export class PlayerDetailsComponent implements OnInit {

    combination: Signal<Combination[]>;

    private timerStateService: TimerStateService = inject(TimerStateService);

    ngOnInit(): void {
        const players = computed(() => this.timerStateService.tournament().players);
        const entries = computed(() => this.timerStateService.tournament().entries);
        const finishes = computed(() => this.timerStateService.tournament().finishes);
        const eliminations = computed(() => this.timerStateService.tournament().eliminations);

        const minRank = Math.min(...finishes().map(f => f.rank));

        this.combination = computed(() => players().map(
            (player: Player) => {
                const rank: number | undefined = finishes().find(f => f.playerId === player.id)?.rank;
                let isLastFinished = false;

                if (rank) {
                    isLastFinished = +rank === +minRank;
                }

                return {
                    image: player.image,
                    name: player.name,
                    rebuys: entries().filter(e => e.playerId === player.id && e.type === EntryType.REBUY).length,
                    addons: entries().filter(e => e.playerId === player.id && e.type === EntryType.ADDON).length,
                    reEntries: entries().filter(e => e.playerId === player.id && (e.type === EntryType.ENTRY || e.type === EntryType.RE_ENTRY)).length,
                    eliminations: eliminations().filter(e => e.eliminator === player.id).length,
                    isFinished: finishes().map(f => f.playerId).includes(player.id),
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
        }));
    }

}
