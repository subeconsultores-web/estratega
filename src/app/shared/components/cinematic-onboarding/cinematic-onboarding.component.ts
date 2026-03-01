import { Component, AfterViewInit, OnDestroy, HostListener, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface OnboardingStep {
    targetSelector: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

@Component({
    selector: 'app-cinematic-onboarding',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cinematic-onboarding.component.html',
    styleUrls: ['./cinematic-onboarding.component.scss']
})
export class CinematicOnboardingComponent implements AfterViewInit, OnDestroy {
    isActive = signal<boolean>(false);
    currentStepIndex = signal<number>(0);

    // Posición del spotlight
    spotlightX = signal<number>(0);
    spotlightY = signal<number>(0);
    spotlightRadius = signal<number>(0);

    // Para la animación de entrada
    isTransitioning = signal<boolean>(false);

    steps: OnboardingStep[] = [
        {
            targetSelector: '#nav-dashboard',
            title: 'Centro de Comando Neuronal',
            description: 'Bienvenido. Aquí monitorizarás la salud de tus proyectos y el flujo de la inteligencia operativa.',
            position: 'bottom'
        },
        {
            targetSelector: '#widget-skill-radar',
            title: 'Radar de Cognición AVE',
            description: 'El Skill Radar proyecta el ADN de competencias en tiempo real, identificando gemas de talento con precisión milimétrica.',
            position: 'left'
        },
        {
            targetSelector: '#widget-magic-proposal',
            title: 'Cotizaciones Mágicas',
            description: 'Forja propuestas irresistibles con interacciones 3D que incrementan la conversión y dejan fascinados a tus prospectos.',
            position: 'right'
        },
        {
            targetSelector: 'body', // Central fallback
            title: 'Sistema Sincronizado',
            description: 'SubeIA Estratega está ahora online. Prepárate para el impacto.',
            position: 'center'
        }
    ];

    private resizeObserver: ResizeObserver | null = null;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Se desactiva el inicio automático temporalmente porque bloquea la vista del usuario.
            // TODO: Implementar un flag en localStorage o un botón de activación manual
            // const hasSeen = localStorage.getItem('onboardingDone');
            // if (!hasSeen) { setTimeout(() => this.startOnboarding(), 1000); }

            this.resizeObserver = new ResizeObserver(() => {
                if (this.isActive()) {
                    this.updateSpotlightPosition();
                }
            });
            this.resizeObserver.observe(document.body);
        }
    }

    ngOnDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (!this.isActive()) return;

        if (event.key === 'Escape') {
            this.endOnboarding();
        } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
            this.nextStep();
        } else if (event.key === 'ArrowLeft') {
            this.prevStep();
        }
    }

    startOnboarding() {
        this.isActive.set(true);
        this.currentStepIndex.set(0);
        this.updateSpotlightPosition();
    }

    nextStep() {
        if (this.isTransitioning()) return;

        if (this.currentStepIndex() < this.steps.length - 1) {
            this.isTransitioning.set(true);
            this.currentStepIndex.update(idx => idx + 1);
            this.updateSpotlightPosition();

            setTimeout(() => {
                this.isTransitioning.set(false);
            }, 600); // Coincide con CSS transition
        } else {
            this.endOnboarding();
        }
    }

    prevStep() {
        if (this.isTransitioning() || this.currentStepIndex() === 0) return;

        this.isTransitioning.set(true);
        this.currentStepIndex.update(idx => idx - 1);
        this.updateSpotlightPosition();

        setTimeout(() => {
            this.isTransitioning.set(false);
        }, 600);
    }

    endOnboarding() {
        this.isActive.set(false);
    }

    private updateSpotlightPosition() {
        const currentStep = this.steps[this.currentStepIndex()];
        if (!currentStep) return;

        if (currentStep.targetSelector === 'body' || currentStep.position === 'center') {
            // Spotlight central y gigante para el abrazo final o inicial genérico
            this.spotlightX.set(window.innerWidth / 2);
            this.spotlightY.set(window.innerHeight / 2);
            this.spotlightRadius.set(Math.max(window.innerWidth, window.innerHeight) * 0.8);
            return;
        }

        const element = document.querySelector(currentStep.targetSelector);
        if (element) {
            const rect = element.getBoundingClientRect();
            // Centrar el spotlight en el elemento
            this.spotlightX.set(rect.left + rect.width / 2);
            this.spotlightY.set(rect.top + rect.height / 2);

            // El radio es ligeramente mayor que el elemento para rodearlo como un aura
            const maxDimension = Math.max(rect.width, rect.height);
            this.spotlightRadius.set(maxDimension * 0.7);

            // Auto-scroll suave hacia el elemento
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback si no se halla el selector (en la demo hardcodeada pasa)
            this.spotlightX.set(window.innerWidth / 2);
            this.spotlightY.set(window.innerHeight / 2);
            this.spotlightRadius.set(300);
        }
    }

    get currentStepData(): OnboardingStep {
        return this.steps[this.currentStepIndex()];
    }
}
