import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, LogOut, Sparkles  } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-portal-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ LogOut, Sparkles }) }
  ],
    template: `
        <div class="min-h-screen bg-gray-50 flex flex-col">
            <!-- Header Navegacion Superior Restringida -->
            <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <!-- Branding -->
                        <div class="flex items-center cursor-pointer" routerLink="/portal">
                            <lucide-icon name="sparkles" class="w-6 h-6 text-primary"></lucide-icon>
                            <span class="ml-2 font-bold text-lg text-gray-900 tracking-tight">Sube IA <span class="text-sm font-medium text-gray-500 ml-1">Portal de Cliente</span></span>
                        </div>

                        <!-- Top Nav -->
                        <nav class="hidden md:flex space-x-8">
                            <a routerLink="/portal" routerLinkActive="text-primary border-primary" [routerLinkActiveOptions]="{exact: true}" class="text-gray-500 hover:text-gray-900 px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Resumen
                            </a>
                            <a routerLink="/portal/proyectos" routerLinkActive="text-primary border-primary" class="text-gray-500 hover:text-gray-900 px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Proyectos
                            </a>
                            <a routerLink="/portal/facturas" routerLinkActive="text-primary border-primary" class="text-gray-500 hover:text-gray-900 px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Mis Facturas
                            </a>
                            <a routerLink="/portal/soporte" routerLinkActive="text-primary border-primary" class="text-gray-500 hover:text-gray-900 px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Soporte
                            </a>
                        </nav>

                        <!-- Perfil / Logout -->
                        <div class="flex items-center">
                            <button (click)="logout()" class="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                <lucide-icon name="log-out" class="w-5 h-5"></lucide-icon>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Contenido Dinámico inyectado -->
            <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <router-outlet></router-outlet>
            </main>
            
            <!-- Footer Sencillo -->
            <footer class="bg-white border-t border-gray-200 mt-auto py-6">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center text-sm text-gray-400">
                    &copy; {{ currentYear }} Operado por Sube IA. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    `
})
export class PortalLayoutComponent {
    authService = inject(AuthService);
    router = inject(Router);
    currentYear = new Date().getFullYear();

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
