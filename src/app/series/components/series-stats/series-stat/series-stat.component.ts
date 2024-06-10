import { Component, input } from '@angular/core';
import { SimpleStat } from '../../../../shared/interfaces/simple-stat.interface';
import { DecimalPipe, NgForOf } from '@angular/common';
import { UserImageRoundComponent } from '../../../../shared/components/user-image-round/user-image-round.component';

@Component({
    selector: 'app-series-stat',
    standalone: true,
    imports: [
        NgForOf,
        UserImageRoundComponent,
        DecimalPipe
    ],
    templateUrl: './series-stat.component.html',
    styleUrls: [
        './series-stat.component.scss',
        '../../../page/series-page/series-page.component.scss'
    ]
})
export class SeriesStatComponent {

    stat = input.required<SimpleStat[]>();
    statTitle = input.required<string>();
    useNumberPipe = input<boolean>(false);

}
