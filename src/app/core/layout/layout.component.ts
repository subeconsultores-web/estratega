import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SubeIAComponent } from '../../shared/components/sube-ia/sube-ia.component';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent, SubeIAComponent, GlobalSearchComponent],
  template: `
    <div class="flex h-screen bg-base overflow-hidden relative">
      <!-- Sidebar Desktop (hidden on mobile for now) -->
      <div class="hidden lg:block h-full z-10">
        <app-sidebar></app-sidebar>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <app-navbar></app-navbar>
        
        <!-- Page scrollable content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div class="mx-auto max-w-7xl">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- SUBE IA Global Assistant -->
      <app-sube-ia></app-sube-ia>

      <!-- Global Cmd+K Search -->
      <app-global-search></app-global-search>
    </div>
  `
})
export class LayoutComponent { }
