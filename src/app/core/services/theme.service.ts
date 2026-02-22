import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(false);

    constructor() {
        this.initTheme();
    }

    toggleTheme() {
        this.isDarkMode.update(dark => !dark);
        this.applyTheme(this.isDarkMode());
    }

    setTheme(isDark: boolean) {
        this.isDarkMode.set(isDark);
        this.applyTheme(isDark);
    }

    private initTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme === 'dark');
            return;
        }

        // Then check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.setTheme(true);
            return;
        }

        // Default to light
        this.setTheme(false);
    }

    private applyTheme(isDark: boolean) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }
}
