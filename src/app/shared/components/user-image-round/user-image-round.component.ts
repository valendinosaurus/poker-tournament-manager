import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-user-image-round',
    templateUrl: './user-image-round.component.html',
    styleUrls: ['./user-image-round.component.scss']
})
export class UserImageRoundComponent {

    @Input() imageUrl: string;
    @Input() size = 40;
    @Input() border: string = 'b-regular';

}
