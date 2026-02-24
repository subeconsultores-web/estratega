import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ChevronRight, LayoutDashboard, LogOut, Sparkles, Users  } from 'lucide-angular';

@Component({
    selector: 'app-superadmin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ChevronRight, LayoutDashboard, LogOut, Sparkles, Users }) }
  ],
    template: `
    <div class="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex">
        <div class="p-6 flex items-center gap-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">S</div>
          <span class="text-lg font-semibold tracking-wide">Estratega SaaS</span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-2">
          <a routerLink="/superadmin" routerLinkActive="bg-white/10 text-white" [routerLinkActiveOptions]="{exact:true}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <lucide-icon name="layout-dashboard" [size]="20"></lucide-icon>
            <span class="font-medium text-sm">Overview</span>
          </a>
          <!-- Futuribles opciones -->
          <a class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 cursor-not-allowed">
            <lucide-icon name="users" [size]="20"></lucide-icon>
            <span class="font-medium text-sm">Gestionar Roles</span>
          </a>
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button (click)="logout()" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm">
            <lucide-icon name="log-out" [size]="16"></lucide-icon>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-8">
          <header class="mb-8 flex justify-between items-center">
            <div>
              <p class="text-sm text-indigo-400 font-medium mb-1">God Mode</p>
              <h1 class="text-3xl font-bold flex items-center gap-2">
                Super Admin Dashboard 
                <lucide-icon name="sparkles" [size]="24" class="text-yellow-500"></lucide-icon>
              </h1>
            </div>
            
            <button class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors" routerLink="/dashboard">
              Volver al CRM Base
              <lucide-icon name="chevron-right" [size]="16"></lucide-icon>
            </button>
          </header>

          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class SuperAdminLayoutComponent {
    private auth = inject(Auth);
    private router = inject(Router);

    async logout() {
        await signOut(this.auth);
        this.router.navigate(['/auth/login']);
    }
}
