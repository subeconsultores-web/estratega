import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, AlertTriangle, Info, Trash2 } from 'lucide-angular';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ AlertTriangle, Info, Trash2 }) }
    ],
    template: `
        <!-- Backdrop -->
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div (click)="cancel()" class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>

            <!-- Dialog Card -->
            <div class="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md transform animate-scale-in">
                <!-- Icon Header -->
                <div class="flex flex-col items-center pt-8 pb-4 px-6">
                    <div [class]="iconBgClass" class="w-14 h-14 rounded-full flex items-center justify-center mb-4">
                        <lucide-icon [name]="iconName" [class]="iconClass" class="w-7 h-7"></lucide-icon>
                    </div>
                    <h3 class="text-lg font-semibold text-txt-primary text-center">{{ title }}</h3>
                </div>

                <!-- Message Body -->
                <div class="px-6 pb-6">
                    <p class="text-sm text-txt-secondary text-center leading-relaxed">{{ message }}</p>
                </div>

                <!-- Actions -->
                <div class="flex border-t border-border">
                    <button (click)="cancel()"
                            class="flex-1 py-3.5 text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-colors rounded-bl-2xl border-r border-border">
                        {{ cancelText }}
                    </button>
                    <button (click)="confirm()"
                            [class]="confirmBtnClass"
                            class="flex-1 py-3.5 text-sm font-semibold transition-colors rounded-br-2xl">
                        {{ confirmText }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.15s ease-out;
        }
        .animate-scale-in {
            animation: scaleIn 0.2s ease-out;
        }
    `]
})
export class ConfirmDialogComponent {
    title = '';
    message = '';
    variant: 'danger' | 'warning' | 'info' = 'danger';
    confirmText = 'Confirmar';
    cancelText = 'Cancelar';

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    get iconName(): string {
        switch (this.variant) {
            case 'danger': return 'trash-2';
            case 'warning': return 'alert-triangle';
            case 'info': return 'info';
        }
    }

    get iconBgClass(): string {
        switch (this.variant) {
            case 'danger': return 'bg-red-500/15';
            case 'warning': return 'bg-amber-500/15';
            case 'info': return 'bg-blue-500/15';
        }
    }

    get iconClass(): string {
        switch (this.variant) {
            case 'danger': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            case 'info': return 'text-blue-500';
        }
    }

    get confirmBtnClass(): string {
        switch (this.variant) {
            case 'danger': return 'text-red-500 hover:bg-red-500/10';
            case 'warning': return 'text-amber-600 hover:bg-amber-500/10';
            case 'info': return 'text-blue-500 hover:bg-blue-500/10';
        }
    }

    confirm() {
        this.confirmed.emit();
    }

    cancel() {
        this.cancelled.emit();
    }
}
