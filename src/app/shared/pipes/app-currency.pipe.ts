import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private readonly currencyService = inject(CurrencyService);

  transform(
    value: number | string | null | undefined,
    display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
    digitsInfo?: string,
    locale?: string,
  ): string | null {
    if (value === null || value === undefined) return null;

    const resolvedLocale = locale ?? this.currencyService.locale();
    const currencyCode = this.currencyService.currencyCode();

    const currencyPipe = new CurrencyPipe(resolvedLocale);

    let result = currencyPipe.transform(
      value,
      currencyCode,
      display === undefined || display === false ? 'symbol' : display,
      digitsInfo ?? '1.2-2',
    );

    if (!result) return result;

    // Ensure space between currency and amount (PKR1200 -> PKR 1200)
    result = result.replace(currencyCode, currencyCode + ' ');

    return result;
  }
}