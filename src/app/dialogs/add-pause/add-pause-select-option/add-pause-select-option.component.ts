import { Component, input } from '@angular/core';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';

@Component({
    selector: 'app-add-pause-select-option',
    standalone: true,
    imports: [],
    templateUrl: './add-pause-select-option.component.html',
    styleUrl: './add-pause-select-option.component.scss'
})
export class AddPauseSelectOptionComponent {

    pause = input.required<BlindLevel>();

}
