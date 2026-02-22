import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
    template: `
    <div class="flex h-screen bg-base overflow-hidden">
      <!-- Sidebar Desktop (hidden on mobile for now) -->
      <div class="hidden lg:block h-full">
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
    </div>
  `
})
export class LayoutComponent { }
