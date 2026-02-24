import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Bell, Clock, Menu, Moon, Search, Sun  } from 'lucide-angular';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Bell, Clock, Menu, Moon, Search, Sun }) }
  ],
    template: `
    <header class="h-16 lg:h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 z-10 sticky top-0">
      
      <!-- Left side: Mobile Menu Button & Search Placeholder -->
      <div class="flex items-center">
        <button class="lg:hidden p-2 -ml-2 mr-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-md">
          <lucide-icon name="menu" class="w-5 h-5"></lucide-icon>
        </button>
        
        <div class="hidden md:flex items-center relative w-64">
          <lucide-icon name="search" class="w-4 h-4 text-txt-muted absolute left-3"></lucide-icon>
          <input type="text" placeholder="Buscar (Cmd+K)" 
                 class="w-full pl-9 pr-4 py-2 bg-base border border-border rounded-lg text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow">
        </div>
      </div>

      <!-- Right side: Actions & Profile -->
      <div class="flex items-center space-x-2 sm:space-x-4">
        
        <!-- Timer Placeholder -->
        <button class="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-base border border-border hover:bg-surface-hover text-sm font-medium transition-colors">
          <lucide-icon name="clock" class="w-4 h-4 mr-2 text-txt-muted"></lucide-icon>
          <span>00:00:00</span>
        </button>

        <!-- Theme Toggle -->
        <button (click)="themeService.toggleTheme()" class="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-full transition-colors">
          <lucide-icon *ngIf="themeService.isDarkMode()" name="sun" class="w-5 h-5"></lucide-icon>
          <lucide-icon *ngIf="!themeService.isDarkMode()" name="moon" class="w-5 h-5"></lucide-icon>
        </button>

        <!-- Notifications -->
        <button class="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-full transition-colors relative">
          <lucide-icon name="bell" class="w-5 h-5"></lucide-icon>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Profile Dropdown Placeholder -->
        <div class="relative ml-2">
          <button class="flex items-center space-x-2 p-1 focus:outline-none">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {{ getUserInitial() }}
            </div>
          </button>
        </div>

      </div>
    </header>
  `
})
export class NavbarComponent {
    themeService = inject(ThemeService);
    authService = inject(AuthService);
    router = inject(Router);

    // Future profile dropdown toggle state
    isDropdownOpen = false;

    getUserInitial(): string {
        // Basic placeholder for now, would be dynamically sourced from User object
        return 'AD';
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
