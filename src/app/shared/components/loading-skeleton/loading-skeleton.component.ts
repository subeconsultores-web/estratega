import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-pulse space-y-4 w-full">
      <ng-container *ngIf="type === 'table'">
        <div class="h-10 bg-gray-200 rounded-lg w-full mb-6"></div>
        <div class="space-y-3">
          <div class="h-8 bg-gray-100 rounded-lg w-full" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'card'">
        <div class="border border-gray-100 rounded-xl p-6 bg-white shadow-sm w-full">
          <div class="flex items-center space-x-4 mb-4">
            <div class="h-12 w-12 rounded-full bg-gray-200"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-100 rounded w-full"></div>
            <div class="h-3 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="type === 'text'">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-100 rounded w-1/2"></div>
      </ng-container>
    </div>
  `
})
export class LoadingSkeleton {
    @Input() type: 'table' | 'card' | 'text' = 'text';
}
