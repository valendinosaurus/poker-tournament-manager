import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SeriesHeader } from '../../page/series-page/series-page.component';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { NgIf } from '@angular/common';
import { MathjaxModule } from 'mathjax-angular';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [NgIf, UserImageRoundComponent, MathjaxModule]
})
export class SeriesHeaderComponent {

    @Input() seriesHeader: SeriesHeader | null;

    @ViewChild('mathParagraph') paragraphElement: ElementRef;

}
