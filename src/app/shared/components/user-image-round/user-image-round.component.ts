import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-user-image-round',
    templateUrl: './user-image-round.component.html',
    styleUrls: ['./user-image-round.component.scss'],
    standalone: true,
    imports: [NgStyle]
})
export class UserImageRoundComponent {

    imageUrl = input.required<string | undefined | null>();
    size = input<number>(32);
    border = input<string>('b-regular');
    borderWidth = input<number>(4);

}
