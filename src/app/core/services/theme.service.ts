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
        // En Estratega V4, forzamos el Dark Mode "Cyber-Corporate" por defecto
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            this.setTheme(false);
            return;
        }

        // Default to dark (Next-Gen Aesthetic)
        this.setTheme(true);
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
