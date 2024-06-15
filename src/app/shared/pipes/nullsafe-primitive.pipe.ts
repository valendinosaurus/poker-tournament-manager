import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nullsafePrimitive',
    standalone: true
})
export class NullsafePrimitivePipe<T> implements PipeTransform {

    transform<T>(value: T | null, fallback: T): T {
        return value ?? fallback;
    }

}
