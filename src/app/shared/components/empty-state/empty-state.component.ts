import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, CheckSquare, FolderOpen, Plus, Search, Users, Briefcase, Clock, FileText, TrendingUp, AlertCircle, FilePlus2 } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ CheckSquare, FolderOpen, Plus, Search, Users, Briefcase, Clock, FileText, TrendingUp, AlertCircle, FilePlus2 }) }
  ],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border bg-surface-hover/30">
      <div class="w-16 h-16 bg-surface rounded-full flex items-center justify-center shadow-elevation-1 mb-4">
        <lucide-icon [name]="icon" [size]="32" class="text-txt-muted"></lucide-icon>
      </div>
      <h3 class="text-lg font-semibold text-txt-primary mb-1">{{ title }}</h3>
      <p class="text-txt-secondary max-w-sm mb-6">{{ description }}</p>
      
      <button *ngIf="actionLabel" 
              (click)="onAction.emit()"
              class="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-110 transition-all focus:ring-4 focus:ring-primary/20 btn-press shadow-elevation-1">
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
