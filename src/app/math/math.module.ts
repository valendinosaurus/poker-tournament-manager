import { ModuleWithProviders, NgModule } from '@angular/core';
import { MathService } from '../core/math.service';
import { MathDirective } from './directives/math.directive';

@NgModule({
    declarations: [
        MathDirective
    ],
    exports: [
        MathDirective
    ]
})
export class MathModule {
    constructor(mathService: MathService) {
        const script = document.createElement('script') as HTMLScriptElement;
        script.type = 'text/javascript';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;

        document.getElementsByTagName('head')[0].appendChild(script);

        const config = document.createElement('script') as HTMLScriptElement;
        config.type = 'text/x-mathjax-config';
        // register notifier to StartupHook and trigger .next() for all subscribers
        config.text = `
    MathJax.Hub.Config({
        skipStartupTypeset: true,
        tex2jax: { inlineMath: [["$", "$"]],displayMath:[["$$", "$$"]] }
      });
      MathJax.Hub.Register.StartupHook('End', () => {
        window.hubReady.next();
        window.hubReady.complete();
      });
    `;
        document.getElementsByTagName('head')[0].appendChild(config);

    }

    public static forRoot(): ModuleWithProviders<any> {
        return {
            ngModule: MathModule,
            providers: [{provide: MathService, useClass: MathService}]
        };
    }
}
