import { Component, computed, ElementRef, input, ViewChild } from '@angular/core';
import { UserImageRoundComponent } from '../../../shared/components/user-image-round/user-image-round.component';
import { JsonPipe } from '@angular/common';
import { SeriesHeader } from '../../interfaces/series-header.interface';

@Component({
    selector: 'app-series-header',
    templateUrl: './series-header.component.html',
    styleUrls: [
        './series-header.component.scss',
        '../../page/series-page/series-page.component.scss'
    ],
    standalone: true,
    imports: [UserImageRoundComponent, JsonPipe]
})
export class SeriesHeaderComponent {

    seriesHeader = input.required<SeriesHeader>();

    enocdedFormulaUri = computed(() =>
        this.seriesHeader().formulaLatexString.replace(/ /g, '%20')
    );

    @ViewChild('mathParagraph') paragraphElement: ElementRef;

}
