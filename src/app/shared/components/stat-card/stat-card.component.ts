import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowDown, ArrowUp  } from 'lucide-angular';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CurrencyFormatPipe],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowDown, ArrowUp }) }
  ],
  template: `
    <div class="bg-surface rounded-xl border border-border p-6 shadow-sm">
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
        <div class="w-12 h-12 rounded-lg flex items-center justify-center" [ngClass]="iconBgClass">
          <lucide-icon [name]="icon" [class]="iconColorClass"></lucide-icon>
        </div>
      </div>
      <div *ngIf="trendText" class="mt-4 flex items-center text-sm">
        <lucide-icon *ngIf="trend === 'up'" name="arrow-up" class="w-4 h-4 text-green-500 mr-1"></lucide-icon>
        <lucide-icon *ngIf="trend === 'down'" name="arrow-down" class="w-4 h-4 text-red-500 mr-1"></lucide-icon>
        <span [ngClass]="trend === 'up' ? 'text-green-500' : (trend === 'down' ? 'text-red-500' : 'text-txt-muted')">
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
      'warning': 'bg-yellow-500/10',
      'danger': 'bg-red-500/10'
    };
    return map[this.color] || map['primary'];
  }

  get iconColorClass(): string {
    const map: Record<string, string> = {
      'primary': 'text-primary',
      'secondary': 'text-secondary',
      'accent': 'text-accent',
      'warning': 'text-yellow-500',
      'danger': 'text-red-500'
    };
    return map[this.color] || map['primary'];
  }
}
