import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Shield, Webhook, Users, Palette } from 'lucide-angular';

@Component({
  selector: 'app-configuracion-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Shield, Webhook, Users, Palette }) }
  ],
  template: `
    <div class="h-full flex flex-col p-6 animate-in fade-in duration-500 relative min-h-[80vh]">
      <!-- Elementos decorativos de fondo (Premium Glows) -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div class="absolute bottom-0 left-10 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <!-- Cabecera -->
      <div class="mb-8 relative z-10">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-3">
          Centro de <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">Configuración</span>
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">Administra tu equipo de trabajo, llaves de API, y los webhooks para automatizaciones con otras aplicaciones.</p>
      </div>

      <!-- Tabs Navigation Premium -->
      <div class="mb-8 relative z-10">
        <nav class="flex space-x-2 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 w-max" aria-label="Tabs">
          <a routerLink="/configuracion/usuarios" routerLinkActive="bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
             class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 group flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer">
            <lucide-icon [img]="UsersIcon" class="mr-2" [size]="18" [ngClass]="{'group-hover:scale-110 transition-transform': true}"></lucide-icon>
            Equipo
          </a>
          
          <a routerLink="/configuracion/api-keys" routerLinkActive="bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
             class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 group flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer">
            <lucide-icon [img]="ShieldIcon" class="mr-2" [size]="18" [ngClass]="{'group-hover:scale-110 transition-transform': true}"></lucide-icon>
            Llaves de Seguridad
          </a>

          <a routerLink="/configuracion/webhooks" routerLinkActive="bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
             class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 group flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer">
            <lucide-icon [img]="WebhookIcon" class="mr-2" [size]="18" [ngClass]="{'group-hover:scale-110 transition-transform': true}"></lucide-icon>
            Webhooks y Eventos
          </a>

          <a routerLink="/configuracion/apariencia" routerLinkActive="bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
             class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 group flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer">
            <lucide-icon [img]="PaletteIcon" class="mr-2" [size]="18" [ngClass]="{'group-hover:scale-110 transition-transform': true}"></lucide-icon>
            Apariencia
          </a>
          
        </nav>
      </div>

      <!-- Router Outlet for Child Routes -->
      <div class="flex-1 relative z-10">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class ConfiguracionLayoutComponent {
  readonly ShieldIcon = Shield;
  readonly WebhookIcon = Webhook;
  readonly UsersIcon = Users;
  readonly PaletteIcon = Palette;
}
