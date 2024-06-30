import { Component, input } from '@angular/core';
import { BlindLevel } from '../../../shared/interfaces/blind-level.interface';

@Component({
    selector: 'app-add-blinds-select-option',
    standalone: true,
    imports: [],
    templateUrl: './add-blinds-select-option.component.html',
    styleUrl: './add-blinds-select-option.component.scss'
})
export class AddBlindsSelectOptionComponent {

    blindLevel = input.required<BlindLevel>();

}
