import { Component, Input } from '@angular/core';
import { SeriesHeader } from '../../page/series-page/series-page.component';
import { MathDirective } from '../../../math/directives/math.directive';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgIf, UserImageRoundComponent, MathDirective]
})
export class SeriesHeaderComponent {

    @Input() seriesHeader: SeriesHeader | null;

}
