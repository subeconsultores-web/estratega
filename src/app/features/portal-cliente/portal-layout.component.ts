import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Briefcase, FileText, HelpCircle, Home, LogOut, Menu, Sparkles, X } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant';
import { PortalChatComponent } from './portal-chat/portal-chat.component';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-portal-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, PortalChatComponent],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, FileText, HelpCircle, Home, LogOut, Menu, Sparkles, X }) }
    ],
    template: `
        <div class="min-h-screen bg-base flex flex-col" *ngIf="tenant$ | async as tenant">
            <!-- Header Navegacion Superior -->
            <header class="bg-surface border-b border-border sticky top-0 z-30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <!-- Branding -->
                        <div class="flex items-center cursor-pointer" routerLink="/portal">
                            <ng-container *ngIf="tenant.config.logoUrl; else noLogo">
                                <img [src]="tenant.config.logoUrl" alt="Logo" class="h-8 w-auto">
                            </ng-container>
                            <ng-template #noLogo>
                                <lucide-icon name="sparkles" class="w-6 h-6 text-primary"></lucide-icon>
                                <span class="ml-2 font-bold text-lg text-txt-primary tracking-tight">{{ tenant.nombreEmpresa || 'Portal de Cliente' }}</span>
                            </ng-template>
                        </div>

                        <!-- Desktop Nav -->
                        <nav class="hidden md:flex space-x-8">
                            <a routerLink="/portal" routerLinkActive="text-primary border-primary" [routerLinkActiveOptions]="{exact: true}" class="text-txt-secondary hover:text-txt-primary px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Resumen
                            </a>
                            <a routerLink="/portal/proyectos" routerLinkActive="text-primary border-primary" class="text-txt-secondary hover:text-txt-primary px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Proyectos
                            </a>
                            <a routerLink="/portal/facturas" routerLinkActive="text-primary border-primary" class="text-txt-secondary hover:text-txt-primary px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Mis Facturas
                            </a>
                            <a routerLink="/portal/cotizaciones" routerLinkActive="text-primary border-primary" class="text-txt-secondary hover:text-txt-primary px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Cotizaciones
                            </a>
                            <a routerLink="/portal/soporte" routerLinkActive="text-primary border-primary" class="text-txt-secondary hover:text-txt-primary px-1 py-5 text-sm font-medium border-b-2 border-transparent transition-colors">
                                Soporte
                            </a>
                        </nav>

                        <!-- Right: Mobile Menu + Logout -->
                        <div class="flex items-center space-x-2">
                            <button (click)="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Menú de navegación" class="md:hidden p-2 text-txt-muted hover:text-txt-primary rounded-lg hover:bg-surface-hover transition-colors">
                                <lucide-icon [name]="isMobileMenuOpen ? 'x' : 'menu'" class="w-5 h-5"></lucide-icon>
                            </button>
                            <button (click)="logout()" aria-label="Cerrar sesión" class="p-2 text-txt-muted hover:text-danger rounded-full hover:bg-danger/10 transition-colors">
                                <lucide-icon name="log-out" class="w-5 h-5"></lucide-icon>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mobile Navigation Dropdown -->
                <div *ngIf="isMobileMenuOpen" class="md:hidden border-t border-border bg-surface shadow-elevation-2">
                    <nav class="px-4 py-3 space-y-1">
                        <a routerLink="/portal" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="bg-primary/10 text-primary" (click)="isMobileMenuOpen = false"
                           class="flex items-center px-3 py-3 rounded-lg text-txt-secondary hover:bg-surface-hover text-sm font-medium transition-colors">
                            <lucide-icon name="home" class="w-5 h-5 mr-3"></lucide-icon> Resumen
                        </a>
                        <a routerLink="/portal/proyectos" routerLinkActive="bg-primary/10 text-primary" (click)="isMobileMenuOpen = false"
                           class="flex items-center px-3 py-3 rounded-lg text-txt-secondary hover:bg-surface-hover text-sm font-medium transition-colors">
                            <lucide-icon name="briefcase" class="w-5 h-5 mr-3"></lucide-icon> Proyectos
                        </a>
                        <a routerLink="/portal/facturas" routerLinkActive="bg-primary/10 text-primary" (click)="isMobileMenuOpen = false"
                           class="flex items-center px-3 py-3 rounded-lg text-txt-secondary hover:bg-surface-hover text-sm font-medium transition-colors">
                            <lucide-icon name="file-text" class="w-5 h-5 mr-3"></lucide-icon> Mis Facturas
                        </a>
                        <a routerLink="/portal/cotizaciones" routerLinkActive="bg-primary/10 text-primary" (click)="isMobileMenuOpen = false"
                           class="flex items-center px-3 py-3 rounded-lg text-txt-secondary hover:bg-surface-hover text-sm font-medium transition-colors">
                            <lucide-icon name="file-text" class="w-5 h-5 mr-3"></lucide-icon> Cotizaciones
                        </a>
                        <a routerLink="/portal/soporte" routerLinkActive="bg-primary/10 text-primary" (click)="isMobileMenuOpen = false"
                           class="flex items-center px-3 py-3 rounded-lg text-txt-secondary hover:bg-surface-hover text-sm font-medium transition-colors">
                            <lucide-icon name="help-circle" class="w-5 h-5 mr-3"></lucide-icon> Soporte
                        </a>
                    </nav>
                </div>
            </header>

            <!-- Contenido Dinámico inyectado -->
            <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <router-outlet></router-outlet>
            </main>
            
            <!-- Footer Sencillo -->
            <footer class="bg-surface border-t border-border mt-auto py-6">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center text-sm text-txt-muted text-center flex-col sm:flex-row gap-2">
                    <span>&copy; {{ currentYear }} {{ tenant.nombreEmpresa || 'Portal' }}.</span>
                    <span class="hidden sm:inline">|</span>
                    <span>Operado por Sube IA.</span>
                </div>
            </footer>

            <!-- ✨ Chat IA del Proyecto -->
            <app-portal-chat></app-portal-chat>
        </div>
    `
})
export class PortalLayoutComponent implements OnInit {
    authService = inject(AuthService);
    tenantService = inject(TenantService);
    router = inject(Router);

    currentYear = new Date().getFullYear();
    isMobileMenuOpen = false;

    // Obtener los datos del tenant y aplicar los estilos (white-label)
    tenant$ = this.tenantService.tenant$.pipe(
        tap(tenant => {
            if (tenant?.config) {
                this.tenantService.applyTenantConfig(tenant.config);
            }
        })
    );

    ngOnInit() {
        // La inicialización se maneja usando el async pipe del template sobre tenant$
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
