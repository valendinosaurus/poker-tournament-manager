import { Component, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../shared/models/entry.interface';
import { Tournament } from '../../../../shared/models/tournament.interface';

@Component({
    selector: 'app-buyin-overview',
    templateUrl: './buyin-overview.component.html',
    styleUrls: ['./buyin-overview.component.scss'],
})
export class BuyinOverviewComponent implements OnChanges {

    @Input() entries: Entry[];
    @Input() tournament: Tournament;

    textEntries = '';
    textRebuys = '';
    textAddons = '';

    ngOnChanges(): void {
        const entries = this.entries.filter((e: Entry) => e.type === 'ENTRY').length;
        const reEntries = this.entries.filter((e: Entry) => e.type === 'RE-ENTRY').length;
        const rebuys = this.entries.filter((e: Entry) => e.type === 'REBUY').length;
        const addons = this.entries.filter((e: Entry) => e.type === 'ADDON').length;

        this.textEntries = `${entries + reEntries}`;

        this.textRebuys = `${rebuys}`;

        this.textAddons = `${addons}`;
    }
}
