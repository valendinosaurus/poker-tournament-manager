import { Component } from '@angular/core';
import { CreateLocationComponent } from './create-location/create-location.component';
import { PageWithSlideMenuComponent } from '../../../shared/components/page-with-slide-menu/page-with-slide-menu.component';

@Component({
    selector: 'app-location-tab',
    templateUrl: './location-tab.component.html',
    styleUrls: ['./location-tab.component.scss'],
    standalone: true,
    imports: [PageWithSlideMenuComponent, CreateLocationComponent]
})
export class LocationTabComponent {

}
