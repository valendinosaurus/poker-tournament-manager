import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';

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

    combination: {
        image: string;
        name: string;
        rebuys: number;
        addons: number;
        reEntries: number;
        isFinished: boolean;
    }[];

    scrollDown = true;

    ngOnChanges(changes: SimpleChanges): void {
        if (this.players && this.entries) {
            this.combination = this.players.map(
                (player: Player) => ({
                    image: player.image,
                    name: player.name,
                    rebuys: this.entries.filter(e => e.playerId === player.id && e.type === 'REBUY').length,
                    addons: this.entries.filter(e => e.playerId === player.id && e.type === 'ADDON').length,
                    reEntries: this.entries.filter(e => e.playerId === player.id && e.type === 'RE-ENTRY').length,
                    isFinished: this.finishes.map(f => f.playerId).includes(player.id)
                })
            );
        }

        // if (changes['trigger']?.currentValue === 'SCROLL') {
        //     if (this.scrollDown) {
        //         document.getElementById('bottomp')?.scrollIntoView({behavior: 'smooth'});
        //     } else {
        //         document.getElementById('topp')?.scrollIntoView({behavior: 'smooth'});
        //     }
        //
        //     this.scrollDown = !this.scrollDown;
        // }
    }

}
