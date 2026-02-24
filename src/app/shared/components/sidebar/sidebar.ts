import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Briefcase, CheckSquare, ChevronDown, Clock, DollarSign, FileBadge, FileText, Key, LayoutDashboard, Menu, PanelLeft, PanelLeftClose, Settings, Sparkles, Users, Webhook  } from 'lucide-angular';

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
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, CheckSquare, ChevronDown, Clock, DollarSign, FileBadge, FileText, Key, LayoutDashboard, Menu, PanelLeft, PanelLeftClose, Settings, Sparkles, Users, Webhook }) }
  ],
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
    {
      label: 'Configuración',
      icon: 'settings',
      expanded: false,
      children: [
        { label: 'API Keys', icon: 'key', route: '/configuracion/api-keys' },
        { label: 'Webhooks', icon: 'webhook', route: '/configuracion/webhooks' }
      ]
    }
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
