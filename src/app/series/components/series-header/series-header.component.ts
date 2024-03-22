import { Component, Input } from '@angular/core';
import { SeriesDetailsS } from '../../../shared/models/series-details.interface';
import { MathContent } from '../../../shared/models/math-content.interface';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ]
})
export class SeriesHeaderComponent {

    @Input() series: SeriesDetailsS;
    @Input() guaranteed: number;
    @Input() formulaString: MathContent;

}
