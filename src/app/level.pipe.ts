import {Pipe, PipeTransform} from '@angular/core';
import {BlindLevel} from "./shared/models/blind-level.interface";
import {Pause} from "./shared/models/pause.interface";

@Pipe({
    name: 'level'
})
export class LevelPipe implements PipeTransform {

    transform(level: BlindLevel | Pause): level is BlindLevel {
        return (level as BlindLevel).sb !== undefined && (level as BlindLevel).bb !== undefined
    }

}
