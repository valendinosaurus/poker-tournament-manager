import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-user-image-round',
    templateUrl: './user-image-round.component.html',
    styleUrls: ['./user-image-round.component.scss'],
    standalone: true,
    imports: [NgStyle]
})
export class UserImageRoundComponent {

    @Input() imageUrl: string | undefined | null;
    @Input() size = 32;
    @Input() border: string = 'b-regular';
    @Input() borderWidth = 4;

}
