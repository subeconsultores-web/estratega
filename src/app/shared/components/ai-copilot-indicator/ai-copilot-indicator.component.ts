import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Sparkles } from 'lucide-angular';

@Component({
    selector: 'app-ai-copilot-indicator',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Sparkles }) }
    ],
    template: `
    <div class="relative group cursor-help ml-2" [title]="getTooltipText()">
      <!-- Outer glow / pulse effect based on state -->
      <div class="absolute inset-0 rounded-full blur-md transition-all duration-700"
           [class.bg-primary]="status === 'idle'"
           [class.bg-accent]="status === 'processing'"
           [class.bg-secondary]="status === 'acting'"
           [class.opacity-40]="status === 'idle'"
           [class.opacity-80]="status !== 'idle'"
           [class.animate-pulse-glow]="status === 'processing' || status === 'acting'">
      </div>
      
      <!-- Core Orb -->
      <div class="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden border border-white/20 glass-panel"
           [class.scale-100]="status === 'idle'"
           [class.scale-110]="status !== 'idle'">
           
        <!-- Inner animated gradient -->
        <div class="absolute inset-0 transition-opacity duration-300"
             [style.background]="getGradientBackground()">
        </div>
        
        <lucide-icon name="sparkles" class="w-4 h-4 text-white relative z-10 drop-shadow-md"
                     [class.animate-pulse]="status === 'processing'"
                     [class.animate-bounce]="status === 'acting'"></lucide-icon>
      </div>
    </div>
  `,
    styles: [`
    /* Additional custom animations just for the AI orb if needed beyond styles.scss */
  `]
})
export class AiCopilotIndicatorComponent {
    /** 
     * 'idle': AI is ready (Blue gradient)
     * 'processing': AI is reading/thinking (Green/Accent gradient)
     * 'acting': AI is performing an action (Purple/Secondary gradient)
     */
    @Input() status: 'idle' | 'processing' | 'acting' = 'idle';

    getTooltipText(): string {
        switch (this.status) {
            case 'processing': return 'Analizando datos...';
            case 'acting': return 'Ejecutando acción autónoma...';
            default: return 'Copiloto de IA disponible';
        }
    }

    getGradientBackground(): string {
        switch (this.status) {
            case 'processing': return 'var(--gradient-accent)';
            case 'acting': return 'var(--gradient-hero)';
            default: return 'var(--gradient-primary)';
        }
    }
}
