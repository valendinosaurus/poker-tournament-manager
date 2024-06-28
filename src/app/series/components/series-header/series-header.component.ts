import { Component, input } from '@angular/core';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { SeriesHeader } from '../../interfaces/series-header.interface';
import { FormulaToImagePipe } from '../../../shared/pipes/formula-to-image.pipe';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [
        UserImageRoundComponent,
        FormulaToImagePipe
    ]
})
export class SeriesHeaderComponent {

    seriesHeader = input.required<SeriesHeader>();

}
