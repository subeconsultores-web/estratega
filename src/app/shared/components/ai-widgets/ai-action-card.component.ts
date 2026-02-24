import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Sparkles, CheckCircle2  } from 'lucide-angular';

export interface ActionPayload {
    actionId: string;
    buttonLabel: string;
    payload: any;
}

@Component({
    selector: 'app-ai-action-card',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Sparkles, CheckCircle2 }) }
  ],
    template: `
    <div class="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-primary-200 dark:border-primary-800/50 shadow-sm flex flex-col gap-2">
        <div class="flex items-center gap-2 mb-1">
            <lucide-icon name="sparkles" [size]="14" class="text-primary-600"></lucide-icon>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Acción Recomendada</p>
        </div>
        
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-1" *ngIf="description">{{description}}</p>

        <button 
            *ngIf="!isCompleted"
            (click)="executeAction()"
            class="w-full py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm">
            {{ actionData.buttonLabel || 'Ejecutar Acción' }}
        </button>

        <div *ngIf="isCompleted" class="w-full py-2 px-3 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium rounded-lg text-sm flex items-center justify-center gap-2 border border-green-200 dark:border-green-800/50">
            <lucide-icon name="check-circle-2" [size]="16"></lucide-icon>
            Acción completada
        </div>
    </div>
  `
})
export class AiActionCardComponent {
    @Input() actionData!: ActionPayload;
    @Input() description?: string;
    @Output() onActionExecuted = new EventEmitter<ActionPayload>();

    isCompleted = false;

    readonly SparklesIcon = Sparkles;
    readonly CheckCircle2Icon = CheckCircle2;

    executeAction() {
        this.isCompleted = true;
        this.onActionExecuted.emit(this.actionData);
        // En un escenario real, este componente delega el payload a un ActionManagerService
    }
}
