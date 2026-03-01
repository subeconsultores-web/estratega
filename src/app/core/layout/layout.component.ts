import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SubeIAComponent } from '../../shared/components/sube-ia/sube-ia.component';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { SessionAuditService } from '../services/session-audit.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent, SubeIAComponent, GlobalSearchComponent],
  template: `
    <div class="flex h-screen bg-base overflow-hidden relative">
      <!-- Sidebar Desktop -->
      <div class="hidden lg:block h-full z-10">
        <app-sidebar></app-sidebar>
      </div>

      <!-- Mobile Sidebar Overlay -->
      <div *ngIf="isMobileSidebarOpen" class="lg:hidden fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div (click)="closeMobileSidebar()" class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
        <!-- Sidebar Panel -->
        <div class="relative z-10 animate-slide-in">
          <app-sidebar #mobileSidebar [showClose]="true" (closeSidebar)="closeMobileSidebar()" (navigated)="closeMobileSidebar()"></app-sidebar>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <app-navbar (toggleSidebar)="toggleMobileSidebar()"></app-navbar>
        
        <!-- Page scrollable content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div class="mx-auto max-w-7xl">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- SUBE IA Global Assistant — deferred for performance -->
      @defer (on idle) {
        <app-sube-ia />
      }

      <!-- Global Cmd+K Search — deferred for performance -->
      @defer (on idle) {
        <app-global-search />
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slideIn 0.2s ease-out;
    }
  `]
})
export class LayoutComponent implements OnInit {
  private sessionAudit = inject(SessionAuditService);
  isMobileSidebarOpen = false;

  ngOnInit() {
    this.sessionAudit.registrarSesion();
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
  }
}
