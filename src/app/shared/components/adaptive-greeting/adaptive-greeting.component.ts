import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sun, Moon, Sunrise, Sunset, CloudRain } from 'lucide-angular';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

@Component({
    selector: 'app-adaptive-greeting',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './adaptive-greeting.component.html',
    styleUrls: ['./adaptive-greeting.component.scss']
})
export class AdaptiveGreetingComponent implements OnInit, OnDestroy {
    // Lucide Icons
    readonly SunIcon = Sun;
    readonly MoonIcon = Moon;
    readonly SunriseIcon = Sunrise;
    readonly SunsetIcon = Sunset;
    readonly RainIcon = CloudRain; // Simbolizando modo enfoque/productividad

    timeOfDay = signal<TimeOfDay>('morning');
    greetingText = signal<string>('Cargando sistemas solares...');
    subGreeting = signal<string>('Analizando métricas ambientales.');

    // Simulated dynamic themes
    themeGlowColor = signal<string>('rgba(255, 165, 0, 0.4)'); // Naranja amanecer por defecto

    private timeChecker: any;

    ngOnInit() {
        this.updateGreeting();
        // Chequear cada 10 minutos si cambió la fase del día (para usuarios que dejan la app abierta)
        this.timeChecker = setInterval(() => this.updateGreeting(), 600000);
    }

    ngOnDestroy() {
        if (this.timeChecker) {
            clearInterval(this.timeChecker);
        }
    }

    private updateGreeting() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            this.timeOfDay.set('morning');
            this.greetingText.set('Buenos días, Comandante.');
            this.subGreeting.set('El sol despunta. Sistemas al 100% para una sesión productiva.');
            this.themeGlowColor.set('rgba(255, 204, 0, 0.5)'); // Amarillo solar
        } else if (hour >= 12 && hour < 18) {
            this.timeOfDay.set('afternoon');
            this.greetingText.set('Buenas tardes. Operaciones en curso.');
            this.subGreeting.set('Velocidad de crucero alcanzada. Revisa los radares de churn.');
            this.themeGlowColor.set('rgba(0, 240, 255, 0.4)'); // Cyan zenit
        } else if (hour >= 18 && hour < 22) {
            this.timeOfDay.set('evening');
            this.greetingText.set('Buenas noches. Ciclo diurno completado.');
            this.subGreeting.set('Los mercados cierran. Excelente momento para auditar métricas.');
            this.themeGlowColor.set('rgba(255, 0, 128, 0.4)'); // Magenta sunset
        } else {
            this.timeOfDay.set('night');
            this.greetingText.set('Sistema Nocturno Activado.');
            this.subGreeting.set('Subrutinas de IA trabajando en segundo plano mientras descansas.');
            this.themeGlowColor.set('rgba(138, 43, 226, 0.5)'); // Purpura profundo (Night/Dark mode)
        }
    }

    // Helper para UI
    get activeIcon(): any {
        switch (this.timeOfDay()) {
            case 'morning': return this.SunriseIcon;
            case 'afternoon': return this.SunIcon;
            case 'evening': return this.SunsetIcon;
            case 'night': return this.MoonIcon;
            default: return this.SunIcon;
        }
    }

    get timeClass(): string {
        return `theme-${this.timeOfDay()}`;
    }
}
