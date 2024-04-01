import { Component, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../../shared/models/entry.interface';
import { Tournament } from '../../../../../shared/models/tournament.interface';
import { EntryType } from '../../../../../shared/enums/entry-type.enum';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-buyin-overview',
    templateUrl: './buyin-overview.component.html',
    styles: [':host{display: contents}'],
    standalone: true,
    imports: [DecimalPipe],
})
export class BuyinOverviewComponent implements OnChanges {

    @Input() entries: Entry[];
    @Input() tournament: Tournament;

    textEntries = '';
    textRebuys = '';
    textAddons = '';

    ngOnChanges(): void {
        const entries = this.entries.filter((e: Entry) => e.type === EntryType.ENTRY).length;
        const reEntries = this.entries.filter((e: Entry) => e.type === EntryType.RE_ENTRY).length;
        const rebuys = this.entries.filter((e: Entry) => e.type === EntryType.REBUY).length;
        const addons = this.entries.filter((e: Entry) => e.type === EntryType.ADDON).length;

        this.textEntries = `${entries + reEntries}`;

        this.textRebuys = `${rebuys}`;

        this.textAddons = `${addons}`;
    }
}
