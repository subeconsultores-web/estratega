import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse space-y-4 w-full">
      <ng-container *ngIf="type === 'table'">
        <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full mb-6"></div>
        <div class="space-y-3">
          <div class="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'card'">
        <div class="border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 bg-white dark:bg-slate-800/80 shadow-sm w-full">
          <div class="flex items-center space-x-4 mb-4">
            <div class="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
            <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'text'">
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
      </ng-container>
    </div>
  `
})
export class LoadingSkeleton {
  @Input() type: 'table' | 'card' | 'text' = 'text';
}
