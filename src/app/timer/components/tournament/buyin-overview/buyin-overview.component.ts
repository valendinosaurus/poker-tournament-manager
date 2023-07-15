import { Component, Input, OnChanges } from '@angular/core';
import { Entry } from '../../../../shared/models/entry.interface';

@Component({
    selector: 'app-buyin-overview',
    templateUrl: './buyin-overview.component.html',
    styleUrls: ['./buyin-overview.component.scss'],
})
export class BuyinOverviewComponent implements OnChanges {

    @Input() entries: Entry[];

    textEntries = '';
    textRebuys = '';
    textAddons = '';

    ngOnChanges(): void {
        const entries = this.entries.filter((e: Entry) => e.type === 'ENTRY').length;
        const rebuys = this.entries.filter((e: Entry) => e.type === 'REBUY').length;
        const addons = this.entries.filter((e: Entry) => e.type === 'ADDON').length;

        this.textEntries = `${entries}`;

        this.textRebuys = `${rebuys}`;

        this.textAddons = `${addons}`;
    }
}
