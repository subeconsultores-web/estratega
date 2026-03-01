import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Briefcase, DollarSign, FileSignature, FileText, KanbanSquare, LayoutDashboard, Leaf, MessageCircle, Package, Receipt, Settings, Sparkles, Users, X } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, DollarSign, FileSignature, FileText, KanbanSquare, LayoutDashboard, Leaf, MessageCircle, Package, Receipt, Settings, Sparkles, Users, X }) }
  ],
  template: `
    <aside class="flex flex-col w-64 h-screen bg-surface/80 backdrop-blur-xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 z-20">
      <!-- Logo Area -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gradient-primary)">
            <lucide-icon name="sparkles" class="w-5 h-5 text-white"></lucide-icon>
          </div>
          <span class="ml-3 font-bold text-lg tracking-tight text-txt-primary">Sube IA</span>
        </div>
        <!-- Close button (mobile only, shown via parent) -->
        <button *ngIf="showClose" (click)="closeSidebar.emit()" class="p-1.5 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-md transition-colors">
          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        <a routerLink="/dashboard" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="layout-dashboard" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Dashboard</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Ventas</div>
        
        <a routerLink="/crm/clientes" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="users" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Clientes & CRM</span>
        </a>

        <a routerLink="/crm/pipeline" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="kanban-square" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Pipeline</span>
        </a>

        <a routerLink="/catalogo/lista" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="package" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Catálogo</span>
        </a>

        <a routerLink="/cotizaciones" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="file-text" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Cotizaciones</span>
        </a>

        <a routerLink="/contratos" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="file-signature" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Contratos</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Finanzas</div>

        <a routerLink="/facturas" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="receipt" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Facturas</span>
        </a>

        <a routerLink="/finanzas" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="dollar-sign" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Finanzas</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Gestión & ESG</div>

        <a routerLink="/proyectos" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="briefcase" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Proyectos</span>
        </a>

        <a routerLink="/esg" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="leaf" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Impacto ESG</span>
        </a>

        <a routerLink="/mensajeria" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="message-circle" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Mensajería</span>
        </a>
      </nav>

      <!-- Bottom Settings -->
      <div class="p-4 border-t border-white/5 space-y-1">
        <a routerLink="/configuracion/usuarios" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="users" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Mi Equipo</span>
        </a>
        <a routerLink="/configuracion" routerLinkActive="bg-primary/10 text-primary font-medium sidebar-active" (click)="onNavigate()"
           [routerLinkActiveOptions]="{exact: true}"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-all duration-200 cursor-pointer group">
          <lucide-icon name="settings" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110"></lucide-icon>
          <span>Configuración</span>
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() navigated = new EventEmitter<void>();

  /** When true, shows the X close button (mobile overlay mode) */
  @Input() showClose = false;

  onNavigate() {
    this.navigated.emit();
  }
}
