import { Component } from '@angular/core';
import { CreateBrandingComponent } from './create-branding/create-branding.component';
import { PageWithSlideMenuComponent } from '../../../shared/components/page-with-slide-menu/page-with-slide-menu.component';

@Component({
    selector: 'app-branding-tab',
    templateUrl: './branding-tab.component.html',
    styleUrls: ['./branding-tab.component.scss'],
    standalone: true,
    imports: [PageWithSlideMenuComponent, CreateBrandingComponent]
})
export class BrandingTabComponent {

}
