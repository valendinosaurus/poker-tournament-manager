import { Component } from '@angular/core';
import { CreatePlayerComponent } from './create-player/create-player.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { PageWithSlideMenuComponent } from '../../../shared/components/page-with-slide-menu/page-with-slide-menu.component';

@Component({
    selector: 'app-player-tab',
    templateUrl: './player-tab.component.html',
    styleUrls: ['./player-tab.component.scss'],
    standalone: true,
    imports: [PageWithSlideMenuComponent, PlayerListComponent, CreatePlayerComponent]
})
export class PlayerTabComponent {

}
