import { Component, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Player } from '../../../../../shared/models/player.interface';
import { Finish } from '../../../../../shared/models/finish.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-chips-overview',
    templateUrl: './chips-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [DecimalPipe],
})
export class ChipsOverviewComponent implements OnChanges {

    @Input() entries: Entry[];
    @Input() players: Player[];
    @Input() finishes: Finish[];
    @Input() startStack: number;
    @Input() rebuyStack: number;
    @Input() addonStack: number;

    totalChips: number = 0;
    averageStack: number = 0;

    ngOnChanges(): void {
        const entries = this.entries.filter((e: Entry) => e.type === EntryType.ENTRY).length;
        const rebuys = this.entries.filter((e: Entry) => e.type === EntryType.REBUY).length;
        const addons = this.entries.filter((e: Entry) => e.type === EntryType.ADDON).length;
        const reEntries = this.entries.filter((e: Entry) => e.type === EntryType.RE_ENTRY).length;

        this.totalChips = entries * this.startStack
            + reEntries * this.startStack
            + rebuys * this.rebuyStack
            + addons * this.addonStack;

        const playersIn = this.players.length - this.finishes.length;

        if (this.finishes.length === this.players.length) {
            this.averageStack = this.totalChips;
        } else {
            this.averageStack = Math.floor(this.totalChips / playersIn);
        }
    }
}
