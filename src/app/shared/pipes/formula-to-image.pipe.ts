import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formulaToImage',
    standalone: true
})
export class FormulaToImagePipe implements PipeTransform {

    transform(formulaDescription: string | undefined): string {
        if (!formulaDescription) {
            return 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png';
        }

        return `https://math.vercel.app/?inline=${formulaDescription.replace(/ /g, '%20')}`;
    }

}
