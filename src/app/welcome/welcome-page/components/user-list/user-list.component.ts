import { Component, input } from '@angular/core';
import { UserImageRoundComponent } from '../../../../shared/components/user-image-round/user-image-round.component';
import { Player } from '../../../../shared/interfaces/player.interface';
import { UserWithImageComponent } from '../../../../shared/components/user-with-image/user-with-image.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
    imports: [
        UserImageRoundComponent,
        UserWithImageComponent
    ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {

    users = input.required<Player[] | null>();
    userImageSize = input.required<number>();
    noEntriesText = input.required<string>();

}
