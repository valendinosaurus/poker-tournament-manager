import { AfterViewInit, Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { Player } from '../../../../shared/models/player.interface';
import { Entry } from '../../../../shared/models/entry.interface';
import { Finish } from '../../../../shared/models/finish.interface';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-player-details',
    templateUrl: './player-details.component.html',
    styleUrls: ['./player-details.component.scss']
})
export class PlayerDetailsComponent implements OnChanges, AfterViewInit {

    @Input() players: Player[];
    @Input() entries: Entry[];
    @Input() finishes: Finish[];

    combination: {
        image: string;
        name: string;
        rebuys: number;
        addons: number;
        reEntries: number;
        isFinished: boolean;
    }[];

    private destroyRef: DestroyRef = inject(DestroyRef);

    ngOnChanges(): void {
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
    }

    ngAfterViewInit(): void {
        let scrollDown = true;

        interval(5000).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                if (scrollDown) {
                    document.getElementById('bottomp')?.scrollIntoView({behavior: 'smooth'});
                } else {
                    document.getElementById('topp')?.scrollIntoView({behavior: 'smooth'});
                }

                scrollDown = !scrollDown;
            })
        ).subscribe();
    }

}
