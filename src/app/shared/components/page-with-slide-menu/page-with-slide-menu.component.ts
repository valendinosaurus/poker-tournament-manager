import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-page-with-slide-menu',
    templateUrl: './page-with-slide-menu.component.html',
    styleUrls: ['./page-with-slide-menu.component.scss'],
    standalone: true,
    imports: [NgIf]
})
export class PageWithSlideMenuComponent {

    isSideVisible = false;

}
