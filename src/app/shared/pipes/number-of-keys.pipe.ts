import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'numberOfKeys',
    standalone: true
})
export class NumberOfKeysPipe implements PipeTransform {

    transform(value: any | null): number {
        return value
            ? Object.keys(value).length
            : 0;
    }

}
