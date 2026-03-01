import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Activity, ArrowDown, ArrowUp, ArrowUpFromLine, Briefcase, CheckSquare, Clock, DollarSign, FileText, TrendingUp } from 'lucide-angular';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CurrencyFormatPipe],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Activity, ArrowDown, ArrowUp, ArrowUpFromLine, Briefcase, CheckSquare, Clock, DollarSign, FileText, TrendingUp }) }
  ],
  template: `
    <div class="bg-surface rounded-xl border border-border p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 relative overflow-hidden group">
      <!-- Accent Stripe -->
      <div class="absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity"
           [style.background]="'linear-gradient(90deg, ' + gradientStart + ', transparent)'">
      </div>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-txt-muted">{{ title }}</p>
          <h3 class="text-2xl font-bold text-txt-primary mt-1">
            <ng-container *ngIf="type === 'currency'; else textValue">
              {{ value | currencyFormat:currency }}
            </ng-container>
            <ng-template #textValue>
              {{ value }}
            </ng-template>
          </h3>
        </div>
        <div class="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" [ngClass]="iconBgClass">
          <lucide-icon [name]="icon" [class]="iconColorClass"></lucide-icon>
        </div>
      </div>
      <div *ngIf="trendText" class="mt-4 flex items-center text-sm">
        <lucide-icon *ngIf="trend === 'up'" name="arrow-up" class="w-4 h-4 text-success mr-1"></lucide-icon>
        <lucide-icon *ngIf="trend === 'down'" name="arrow-down" class="w-4 h-4 text-danger mr-1"></lucide-icon>
        <span [ngClass]="trend === 'up' ? 'text-success' : (trend === 'down' ? 'text-danger' : 'text-txt-muted')">
          {{ trendText }}
        </span>
        <span class="text-txt-muted ml-1">{{ trendDesc }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() title!: string;
  @Input() value!: number | string;
  @Input() type: 'text' | 'currency' = 'text';
  @Input() currency = 'CLP';
  @Input() icon = 'activity';
  @Input() color: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger' = 'primary';

  @Input() trend?: 'up' | 'down' | 'neutral';
  @Input() trendText?: string;
  @Input() trendDesc?: string;

  get iconBgClass(): string {
    const map: Record<string, string> = {
      'primary': 'bg-primary/10',
      'secondary': 'bg-secondary/10',
      'accent': 'bg-accent/10',
      'warning': 'bg-warning/10',
      'danger': 'bg-danger/10'
    };
    return map[this.color] || map['primary'];
  }

  get iconColorClass(): string {
    const map: Record<string, string> = {
      'primary': 'text-primary',
      'secondary': 'text-secondary',
      'accent': 'text-accent',
      'warning': 'text-warning',
      'danger': 'text-danger'
    };
    return map[this.color] || map['primary'];
  }

  get gradientStart(): string {
    const map: Record<string, string> = {
      'primary': 'var(--color-primary)',
      'secondary': 'var(--color-secondary)',
      'accent': 'var(--color-accent)',
      'warning': 'var(--color-warning)',
      'danger': 'var(--color-danger)'
    };
    return map[this.color] || map['primary'];
  }
}
