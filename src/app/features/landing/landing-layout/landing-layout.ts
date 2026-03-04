import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Menu, X, Sun, Moon, Globe, ChevronDown, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Zap } from 'lucide-angular';
import { LanguageService, LanguageCode } from '../../../core/services/language';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing-layout.html',
  styleUrl: './landing-layout.scss',
})
export class LandingLayout {
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);

  isMobileMenuOpen = signal(false);
  isLangMenuOpen = signal(false);
  currentYear = new Date().getFullYear();

  readonly icons = { Menu, X, Sun, Moon, Globe, ChevronDown, ArrowRight, Facebook, Twitter, Instagram, Linkedin, Zap };

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleLangMenu() {
    this.isLangMenuOpen.update(v => !v);
  }

  setLanguage(lang: LanguageCode) {
    this.languageService.setLanguage(lang);
    this.isLangMenuOpen.set(false);
  }

  get currentLang() {
    return this.languageService.currentLang();
  }

  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}

