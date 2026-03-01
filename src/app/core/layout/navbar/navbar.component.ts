import { Component, EventEmitter, inject, Output, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Bell, ChevronDown, Clock, LogOut, Menu, Moon, Pause, Play, Search, Square, Sun, User } from 'lucide-angular';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { TimetrackingService, ActiveTracker } from '../../services/timetracking.service';
import { Router, RouterModule } from '@angular/router';
import { AiCopilotIndicatorComponent } from '../../../shared/components/ai-copilot-indicator/ai-copilot-indicator.component';
import { interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, AiCopilotIndicatorComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Bell, ChevronDown, Clock, LogOut, Menu, Moon, Pause, Play, Search, Square, Sun, User }) }
  ],
  template: `
    <header class="h-16 lg:h-16 bg-surface/70 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-4 lg:px-6 z-10 sticky top-0 transition-colors duration-300">
      
      <!-- Left side: Mobile Menu Button & Search -->
      <div class="flex items-center">
        <button (click)="toggleSidebar.emit()" class="lg:hidden p-2 -ml-2 mr-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-md transition-colors btn-press">
          <lucide-icon name="menu" class="w-5 h-5"></lucide-icon>
        </button>
        
        <!-- Logo visible on mobile only -->
        <span class="lg:hidden font-bold text-base text-txt-primary mr-4">Sube IA</span>

        <!-- Search trigger — opens GlobalSearchComponent modal -->
        <button (click)="openGlobalSearch()"
                class="hidden md:flex items-center relative w-64 cursor-text group">
          <lucide-icon name="search" class="w-4 h-4 text-txt-muted absolute left-3 group-hover:text-primary transition-colors"></lucide-icon>
          <span class="w-full pl-9 pr-4 py-2 bg-base/50 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-txt-muted text-left transition-all group-hover:border-primary/50 group-hover:shadow-glow-primary">
            Buscar (Cmd+K)
          </span>
        </button>
      </div>

      <!-- Right side: Actions & Profile -->
      <div class="flex items-center space-x-2 sm:space-x-4">
        
        <!-- Timer - Only shows when actively tracking -->
        <button *ngIf="activeTracker"
                (click)="toggleTimer()"
                class="hidden sm:flex items-center px-3 py-1.5 rounded-full border transition-colors"
                [class]="activeTracker.isActive 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'">
          <lucide-icon [name]="activeTracker.isActive ? 'pause' : 'play'" class="w-3.5 h-3.5 mr-2"></lucide-icon>
          <span class="text-sm font-mono font-medium">{{ formatTime(currentElapsed) }}</span>
        </button>

        <!-- Timer idle state (no active session) -> Now shows current time -->
        <button *ngIf="!activeTracker"
                title="Reloj actual (No hay temporizador activo)"
                class="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-base/50 backdrop-blur-sm border border-white/10 text-sm text-txt-muted cursor-default hover:border-white/20 transition-colors">
          <lucide-icon name="clock" class="w-4 h-4 mr-2 text-txt-muted"></lucide-icon>
          <span class="font-mono">{{ currentTime | date:'HH:mm:ss' }}</span>
        </button>

        <!-- Theme Toggle -->
        <button (click)="themeService.toggleTheme()" class="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-full transition-colors hidden sm:block">
          <lucide-icon *ngIf="themeService.isDarkMode()" name="sun" class="w-5 h-5"></lucide-icon>
          <lucide-icon *ngIf="!themeService.isDarkMode()" name="moon" class="w-5 h-5"></lucide-icon>
        </button>

        <!-- AI Copilot Indicator -->
        <app-ai-copilot-indicator status="idle"></app-ai-copilot-indicator>

        <!-- Notifications (no fake badge) -->
        <button class="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-hover rounded-full transition-colors relative">
          <lucide-icon name="bell" class="w-5 h-5"></lucide-icon>
          <!-- Badge removed: no notification service exists. Re-add when a notification system is implemented. -->
        </button>

        <!-- Profile Dropdown -->
        <div class="relative ml-2">
          <button (click)="isDropdownOpen = !isDropdownOpen" class="flex items-center space-x-2 p-1 focus:outline-none group">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-elevation-1 transition-shadow group-hover:shadow-glow-primary"
                 style="background: var(--gradient-primary)">
              {{ getUserInitial() }}
            </div>
            <lucide-icon name="chevron-down" class="w-4 h-4 text-txt-muted hidden sm:block transition-transform duration-200" [class.rotate-180]="isDropdownOpen"></lucide-icon>
          </button>

          <!-- Dropdown Menu -->
          <div *ngIf="isDropdownOpen" class="absolute right-0 mt-2 w-56 glass rounded-xl shadow-elevation-3 z-50 py-2 animate-scale-in">
            <div class="px-4 py-2 border-b border-border/50">
              <p class="text-sm font-medium text-txt-primary truncate">{{ getUserEmail() }}</p>
              <p class="text-xs text-txt-muted">Cuenta activa</p>
            </div>
            <button (click)="isDropdownOpen = false" routerLink="/configuracion"
                    class="w-full flex items-center px-4 py-2.5 text-sm text-txt-secondary hover:bg-surface-hover hover:text-txt-primary transition-colors">
              <lucide-icon name="user" class="w-4 h-4 mr-3"></lucide-icon> Mi Perfil
            </button>
            <div class="border-t border-border/50 my-1"></div>
            <button (click)="logout()" class="w-full flex items-center px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors">
              <lucide-icon name="log-out" class="w-4 h-4 mr-3"></lucide-icon> Cerrar Sesión
            </button>
          </div>
        </div>

      </div>
    </header>

    <!-- Click-outside backdrop for dropdown -->
    <div *ngIf="isDropdownOpen" (click)="isDropdownOpen = false" class="fixed inset-0 z-40"></div>
  `
})
export class NavbarComponent implements OnInit {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  timetrackingService = inject(TimetrackingService);
  router = inject(Router);
  private destroyRef = inject(DestroyRef);

  @Output() toggleSidebar = new EventEmitter<void>();

  isDropdownOpen = false;
  activeTracker: ActiveTracker | null = null;
  currentElapsed = 0;
  currentTime: Date = new Date();

  constructor() {
    // Wire timer to TimetrackingService
    this.timetrackingService.activeSession$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(session => this.activeTracker = session);

    this.timetrackingService.currentElapsed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(seconds => this.currentElapsed = seconds);
  }

  ngOnInit() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime = new Date();
      });
  }

  getUserInitial(): string {
    const user = this.authService['auth'].currentUser;
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  }

  getUserEmail(): string {
    return this.authService['auth'].currentUser?.email || '';
  }

  formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  toggleTimer() {
    if (this.activeTracker?.isActive) {
      this.timetrackingService.pauseTracking();
    } else {
      this.timetrackingService.resumeTracking();
    }
  }

  openGlobalSearch() {
    // Simulate Ctrl+K to trigger GlobalSearchComponent
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  }

  async logout() {
    this.isDropdownOpen = false;
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
