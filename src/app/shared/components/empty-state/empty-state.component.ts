import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
      <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <lucide-icon [name]="icon" [size]="32" class="text-gray-400"></lucide-icon>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ title }}</h3>
      <p class="text-gray-500 max-w-sm mb-6">{{ description }}</p>
      
      <button *ngIf="actionLabel" 
              (click)="onAction.emit()"
              class="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100">
        <lucide-icon *ngIf="actionIcon" [name]="actionIcon" [size]="16" class="mr-2"></lucide-icon>
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyState {
    @Input() icon: string = 'folder-open';
    @Input() title: string = 'No hay datos';
    @Input() description: string = 'Aún no hay registros disponibles en esta sección.';
    @Input() actionLabel?: string;
    @Input() actionIcon?: string;

    @Output() onAction = new EventEmitter<void>();
}
