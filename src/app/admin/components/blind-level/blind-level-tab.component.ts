import { Component } from '@angular/core';
import { CreatePauseComponent } from './create-pause/create-pause.component';
import { CreateBlindLevelComponent } from './create-blind-level/create-blind-level.component';
import { BlindLevelListComponent } from './blind-level-list/blind-level-list.component';
import { PageWithSlideMenuComponent } from '../../../shared/components/page-with-slide-menu/page-with-slide-menu.component';

@Component({
    selector: 'app-blind-level-tab',
    templateUrl: './blind-level-tab.component.html',
    styleUrls: ['./blind-level-tab.component.scss'],
    standalone: true,
    imports: [PageWithSlideMenuComponent, BlindLevelListComponent, CreateBlindLevelComponent, CreatePauseComponent]
})
export class BlindLevelTabComponent {

}
