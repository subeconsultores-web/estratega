import { Injectable, signal, effect } from '@angular/core';

export type LanguageCode = 'es' | 'en' | 'pt';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<LanguageCode>('es');

  constructor() {
    const savedLang = localStorage.getItem('subeia_lang') as LanguageCode;
    if (savedLang && ['es', 'en', 'pt'].includes(savedLang)) {
      this.currentLang.set(savedLang);
    } else {
      // detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (['es', 'en', 'pt'].includes(browserLang)) {
        this.currentLang.set(browserLang as LanguageCode);
      }
    }

    effect(() => {
      localStorage.setItem('subeia_lang', this.currentLang());
      document.documentElement.lang = this.currentLang();
    });
  }

  setLanguage(lang: LanguageCode) {
    this.currentLang.set(lang);
  }

  getTranslate(obj: { es: string; en: string; pt: string } | undefined | null): string {
    if (!obj) return '';
    return obj[this.currentLang()] || obj.es || '';
  }
}
