import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <aside class="flex flex-col w-64 h-screen bg-surface border-r border-border transition-all duration-300 z-20">
      <!-- Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-border">
        <lucide-icon name="sparkles" class="w-6 h-6 text-primary"></lucide-icon>
        <span class="ml-3 font-bold text-lg tracking-tight text-txt-primary">Sube IA</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <a routerLink="/dashboard" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="layout-dashboard" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Dashboard</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Ventas</div>
        
        <a routerLink="/crm/clientes" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="users" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Clientes & CRM</span>
        </a>

        <a routerLink="/catalogo/lista" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="packages" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Catálogo</span>
        </a>

        <a routerLink="/cotizaciones" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="file-text" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Cotizaciones</span>
        </a>

        <a routerLink="/contratos" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="file-signature" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Contratos</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Finanzas</div>

        <a routerLink="/facturas" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="receipt" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Facturas</span>
        </a>

        <div class="pt-4 pb-2 px-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">Gestión</div>

        <a routerLink="/proyectos" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="briefcase" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Proyectos</span>
        </a>

        <a routerLink="/finanzas" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="dollar-sign" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Finanzas</span>
        </a>
      </nav>

      <!-- Bottom Settings -->
      <div class="p-4 border-t border-border">
        <a routerLink="/configuracion" routerLinkActive="bg-primary/10 text-primary font-medium"
           class="flex items-center px-3 py-2.5 rounded-lg text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors cursor-pointer">
          <lucide-icon name="settings" class="w-5 h-5 mr-3"></lucide-icon>
          <span>Configuración</span>
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent { }
