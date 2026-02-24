import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Briefcase, FileText, Loader2, Search, User  } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { FacturaService } from '../../../core/services/factura.service';
import { firstValueFrom } from 'rxjs';

interface SearchResult {
    id: string;
    type: 'cliente' | 'proyecto' | 'factura';
    title: string;
    subtitle: string;
    route: string;
    icon: string;
}

@Component({
    selector: 'app-global-search',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, FileText, Loader2, Search, User }) }
  ],
    templateUrl: './global-search.component.html'
})
export class GlobalSearchComponent implements OnInit {
    isOpen = false;
    searchQuery = '';
    results: SearchResult[] = [];
    selectedIdx = 0;
    isLoading = false;

    private router = inject(Router);
    private crmService = inject(CrmService);
    private proyectosService = inject(ProyectosService);
    private facturaService = inject(FacturaService);

    // Cache to avoid refetching during session if opened multiple times (optional)
    private cache: SearchResult[] = [];
    private hasFetched = false;

    ngOnInit() { }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            this.toggleModal();
        }

        if (this.isOpen) {
            if (event.key === 'Escape') {
                this.closeModal();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.selectedIdx = Math.min(this.selectedIdx + 1, this.results.length - 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.selectedIdx = Math.max(this.selectedIdx - 1, 0);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                this.navigateToSelected();
            }
        }
    }

    toggleModal() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.searchQuery = '';
            this.results = [];
            this.selectedIdx = 0;
            setTimeout(() => {
                document.getElementById('globalSearchInput')?.focus();
            }, 50);
            this.warmUpCache();
        }
    }

    closeModal() {
        this.isOpen = false;
    }

    async warmUpCache() {
        if (this.hasFetched) return;
        this.isLoading = true;
        try {
            const [clientes, proyectos, facturas] = await Promise.all([
                firstValueFrom(this.crmService.getClientes()),
                firstValueFrom(this.proyectosService.getProyectos()),
                firstValueFrom(this.facturaService.getFacturas())
            ]);

            const mappedClientes: SearchResult[] = clientes.map(c => ({
                id: c.id!, type: 'cliente', title: c.nombreEmpresa, subtitle: c.contactoPrincipal?.email || 'Sin correo', route: `/dashboard/clientes/${c.id}`, icon: 'user'
            }));

            const mappedProyectos: SearchResult[] = proyectos.map(p => ({
                id: p.id!, type: 'proyecto', title: p.nombre, subtitle: `Estado: ${p.estado}`, route: `/dashboard/proyectos/${p.id}`, icon: 'briefcase'
            }));

            const mappedFacturas: SearchResult[] = facturas.map(f => {
                const cName = clientes.find(c => c.id === f.clienteId)?.nombreEmpresa || 'S/N';
                return {
                    id: f.id!, type: 'factura', title: `Factura ${f.codigoFormateado || f.id}`, subtitle: `Cliente: ${cName} - $${f.total}`, route: `/dashboard/cotizaciones/factura/${f.id}`, icon: 'file-text'
                };
            });

            this.cache = [...mappedClientes, ...mappedProyectos, ...mappedFacturas];
            this.hasFetched = true;
        } catch (err) {
            console.error('Error preloading search cache', err);
        } finally {
            this.isLoading = false;
        }
    }

    onSearch() {
        if (!this.searchQuery.trim()) {
            this.results = [];
            return;
        }
        const q = this.searchQuery.toLowerCase();
        this.results = this.cache.filter(item =>
            item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
        ).slice(0, 10); // Limit to 10 results
        this.selectedIdx = 0;
    }

    selectItem(idx: number) {
        this.selectedIdx = idx;
        this.navigateToSelected();
    }

    navigateToSelected() {
        if (this.results.length === 0 || !this.results[this.selectedIdx]) return;
        const selected = this.results[this.selectedIdx];
        this.closeModal();
        this.router.navigate([selected.route]);
    }
}
