import { Component, input } from '@angular/core';
import { UserImageRoundComponent } from '../../../../shared/components/user-image-round/user-image-round.component';
import { Player } from '../../../../shared/models/player.interface';

@Component({
  selector: 'app-user-list',
  standalone: true,
    imports: [
        UserImageRoundComponent
    ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {

    users = input.required<Player[] | null>();
    userImageSize = input.required<number>();
    noEntriesText = input.required<string>();

}
