import { Component, Input } from '@angular/core';
import { Tournament } from '../../../../shared/models/tournament.interface';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

    @Input() tournament: Tournament;

}
