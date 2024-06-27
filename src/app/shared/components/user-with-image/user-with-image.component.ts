import { Component, input } from '@angular/core';
import { UserImageRoundComponent } from '../user-image-round/user-image-round.component';

@Component({
    selector: 'app-user-with-image',
    templateUrl: './user-with-image.component.html',
    styleUrl: './user-with-image.component.scss',
    standalone: true,
    imports: [
        UserImageRoundComponent
    ]
})
export class UserWithImageComponent {

    name = input.required<string>();
    subtitle = input<string | null | undefined>(undefined);
    image = input.required<string>();
    size = input<number>(32);
    border = input<string>('b-regular');
    borderWidth = input<number>(4);

}
