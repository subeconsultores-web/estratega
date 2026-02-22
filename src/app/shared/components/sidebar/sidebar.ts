import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isCollapsed: WritableSignal<boolean> = signal(false);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'Clientes (CRM)', icon: 'users', route: '/crm' },
    {
      label: 'Ventas',
      icon: 'file-text',
      expanded: false,
      children: [
        { label: 'Cotizaciones', icon: 'file-badge', route: '/cotizaciones' },
        { label: 'Contratos', icon: 'check-square', route: '/contratos' }
      ]
    },
    { label: 'Proyectos', icon: 'briefcase', route: '/proyectos' },
    { label: 'Finanzas', icon: 'dollar-sign', route: '/finanzas' },
    { label: 'Timetracking', icon: 'clock', route: '/timetracking' },
  ];

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }

  toggleSubmenu(item: MenuItem) {
    if (item.children) {
      if (this.isCollapsed()) {
        this.isCollapsed.set(false);
      }
      item.expanded = !item.expanded;
    }
  }
}
