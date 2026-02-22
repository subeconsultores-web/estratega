import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat',
    standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: number | string | null | undefined, currencyCode: string = 'CLP'): string {
        if (value == null || value === '') return '';
        const num = typeof value === 'string' ? parseFloat(value) : value;

        switch (currencyCode) {
            case 'CLP':
                return new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    maximumFractionDigits: 0
                }).format(num);

            case 'UF':
                // UF formatting: "45,3 UF"
                const ufStr = new Intl.NumberFormat('es-CL', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 2
                }).format(num);
                return `${ufStr} UF`;

            case 'USD':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(num);

            default:
                return num.toString();
        }
    }
}
