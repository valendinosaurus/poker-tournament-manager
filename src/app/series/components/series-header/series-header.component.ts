import { Component, Input } from '@angular/core';
import { SeriesHeader } from '../../page/series-page/series-page.component';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ]
})
export class SeriesHeaderComponent {

    @Input() seriesHeader: SeriesHeader | null;

}
